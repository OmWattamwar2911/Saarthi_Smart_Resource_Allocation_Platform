import admin from "firebase-admin";
import { needsStore, volunteersStore } from "../src/utils/store.js";

const ZONES = ["Barmer East", "Siwana", "Balotra", "Gudamalani", "Dhrimanna", "Pachpadra"];
const CATEGORIES = ["Medical", "Shelter", "Food", "Education", "Logistics"];
const CATEGORY_KEY_MAP = {
  medical: "Medical",
  "food & water": "Food",
  food: "Food",
  water: "Food",
  shelter: "Shelter",
  education: "Education",
  logistics: "Logistics"
};

let dbRef = null;
let useLocalFallback = false;

function normalizePrivateKey(value) {
  return String(value || "").replace(/\\n/g, "\n");
}

function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate();
  }

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function normalizeCategory(value) {
  const key = String(value || "").trim().toLowerCase();
  if (!key) {
    return "Logistics";
  }

  return CATEGORY_KEY_MAP[key] || CATEGORIES.find((item) => item.toLowerCase() === key) || "Logistics";
}

function normalizeZone(value) {
  const zone = String(value || "").trim();
  if (!zone) {
    return "Barmer East";
  }

  return zone;
}

function isOpenStatus(status) {
  const normalized = String(status || "").toLowerCase();
  return ["open", "assigned", "queued", "in_progress", "in progress"].includes(normalized);
}

function isResolvedStatus(status) {
  const normalized = String(status || "").toLowerCase();
  return normalized === "resolved" || normalized === "closed";
}

function isEscalatedNeed(need) {
  const status = String(need.status || "").toLowerCase();
  return Boolean(need.escalated || need.isEscalated || need.escalationLevel) || status === "escalated";
}

function average(numbers) {
  if (!numbers.length) {
    return 0;
  }

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function minutesBetween(startValue, endValue) {
  const start = toDate(startValue);
  const end = toDate(endValue);

  if (!start || !end) {
    return null;
  }

  const diff = Math.floor((end.getTime() - start.getTime()) / 60000);
  return diff >= 0 ? diff : null;
}

function initializeFirestore() {
  if (useLocalFallback) {
    return null;
  }

  if (dbRef) {
    return dbRef;
  }

  if (!admin.apps.length) {
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const applicationCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || "smart-resource-alloc";

    if (!serviceAccountRaw && !applicationCredentialsPath) {
      useLocalFallback = true;
      return null;
    }

    try {
      if (serviceAccountRaw) {
        const parsed = JSON.parse(serviceAccountRaw);
        if (parsed.private_key) {
          parsed.private_key = normalizePrivateKey(parsed.private_key);
        }

        admin.initializeApp({
          credential: admin.credential.cert(parsed),
          projectId
        });
      } else {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId
        });
      }
    } catch (error) {
      useLocalFallback = true;
      return null;
    }
  }

  dbRef = admin.firestore();
  return dbRef;
}

function firestore() {
  return initializeFirestore();
}

function usingLocalFallback() {
  return firestore() === null;
}

async function readCollection(collectionName) {
  const db = firestore();
  const snapshot = await db.collection(collectionName).get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() || {})
  }));
}

function buildLocalCollections() {
  const now = Date.now();
  const needs = needsStore.map((item, index) => ({
    id: String(item.id || index + 1),
    locationName: item.location,
    category: item.category,
    status: String(item.status || "open").toLowerCase() === "matched" ? "in_progress" : item.status,
    urgencyScore: Number(item.urgency || 5),
    createdAt: new Date(now - (index + 2) * 86400000).toISOString(),
    updatedAt: new Date(now - index * 43200000).toISOString()
  }));

  const volunteers = volunteersStore.map((item, index) => ({
    id: String(item.id || index + 1),
    name: item.name,
    isAvailable: String(item.status || "").toLowerCase() === "available",
    currentTaskId: null,
    lastSeen: new Date(now - (index + 1) * 3600000).toISOString(),
    isActive: true
  }));

  const assignments = [];
  return { needs, volunteers, assignments, source: "local" };
}

async function getCollections() {
  if (usingLocalFallback()) {
    return buildLocalCollections();
  }

  try {
    const [needs, volunteers, assignments] = await Promise.all([
      readCollection("needs"),
      readCollection("volunteers"),
      readCollection("assignments")
    ]);

    return { needs, volunteers, assignments, source: "firestore" };
  } catch (error) {
    useLocalFallback = true;
    return buildLocalCollections();
  }
}

function buildNeedLookup(needs) {
  const map = new Map();
  for (const need of needs) {
    map.set(String(need.id || need.needId || ""), need);
  }
  return map;
}

function getAssignmentNeedId(assignment) {
  return String(assignment.needId || assignment.need_id || assignment.needID || "");
}

function getAssignmentVolunteerId(assignment) {
  return String(assignment.volunteerId || assignment.volunteer_id || assignment.volunteerID || "");
}

function getDispatchMinutes(assignment, need) {
  const start = need?.createdAt || need?.created_at;
  const end = assignment?.confirmedAt || assignment?.generatedAt || assignment?.createdAt;
  return minutesBetween(start, end);
}

export async function getAnalyticsSummary() {
  const { needs, volunteers, assignments } = await getCollections();
  const needLookup = buildNeedLookup(needs);

  const openNeedsList = needs.filter((need) => isOpenStatus(need.status));
  const resolvedNeedsList = needs.filter((need) => isResolvedStatus(need.status));
  const escalatedNeedsList = needs.filter((need) => isEscalatedNeed(need));

  const confidenceScores = assignments
    .map((assignment) => Number(assignment.confidenceScore || assignment.confidence || 0))
    .filter((value) => Number.isFinite(value) && value >= 0);

  const responseTimeMinutes = assignments
    .map((assignment) => {
      const needId = getAssignmentNeedId(assignment);
      const need = needLookup.get(needId);
      return getDispatchMinutes(assignment, need);
    })
    .filter((value) => Number.isFinite(value));

  const assignedNeedIds = new Set(assignments.map((assignment) => getAssignmentNeedId(assignment)).filter(Boolean));

  const activeVolunteers = volunteers.filter((volunteer) => {
    if (volunteer.isActive === false) {
      return false;
    }

    const availability = String(volunteer.availability || volunteer.status || "").toLowerCase();
    if (["inactive", "offline"].includes(availability)) {
      return false;
    }

    return true;
  }).length;

  const avgResponseTime = Math.round(average(responseTimeMinutes));
  const avgDispatchMin = avgResponseTime;

  return {
    openNeeds: openNeedsList.length,
    resolved: resolvedNeedsList.length,
    escalations: escalatedNeedsList.length,
    activeVolunteers,
    avgDispatchMin,
    aiMatchAccuracy: Math.round(average(confidenceScores)),
    avgResponseTime,
    unmatchedNeeds: needs.filter((need) => !assignedNeedIds.has(String(need.id || need.needId || ""))).length
  };
}

function buildCategoryCounter() {
  return {
    medical: 0,
    shelter: 0,
    food: 0,
    education: 0,
    logistics: 0
  };
}

function setCategoryCount(counter, category) {
  const key = String(category || "").toLowerCase();
  if (key.includes("medical")) counter.medical += 1;
  else if (key.includes("shelter")) counter.shelter += 1;
  else if (key.includes("food") || key.includes("water")) counter.food += 1;
  else if (key.includes("education")) counter.education += 1;
  else counter.logistics += 1;
}

function getStatusBadge(avgDispatchMin) {
  if (avgDispatchMin <= 16) return "Excellent";
  if (avgDispatchMin <= 23) return "Good";
  if (avgDispatchMin <= 30) return "Moderate";
  return "Slow";
}

export async function getZoneAnalytics() {
  const { needs, assignments } = await getCollections();
  const needLookup = buildNeedLookup(needs);

  const zonesMap = new Map();
  const orderedZones = [...new Set([...ZONES, ...needs.map((need) => normalizeZone(need.locationName || need.location || need.zone))])];

  for (const zone of orderedZones) {
    zonesMap.set(zone, {
      zone,
      priorityScore: 0,
      openNeeds: 0,
      resolvedNeeds: 0,
      avgDispatchMin: 0,
      categories: buildCategoryCounter()
    });
  }

  for (const need of needs) {
    const zone = normalizeZone(need.locationName || need.location || need.zone);
    const category = normalizeCategory(need.category);
    const urgencyScore = Math.max(0, Math.min(10, Number(need.urgencyScore || need.urgency || 0)));

    const row = zonesMap.get(zone);
    if (!row) continue;

    if (isOpenStatus(need.status)) {
      row.openNeeds += 1;
      row.priorityScore += urgencyScore;
      setCategoryCount(row.categories, category);
    }

    if (isResolvedStatus(need.status)) {
      row.resolvedNeeds += 1;
    }
  }

  const dispatchByZone = new Map();
  for (const assignment of assignments) {
    const need = needLookup.get(getAssignmentNeedId(assignment));
    if (!need) continue;

    const zone = normalizeZone(need.locationName || need.location || need.zone);
    const dispatchMin = getDispatchMinutes(assignment, need);
    if (!Number.isFinite(dispatchMin)) continue;

    if (!dispatchByZone.has(zone)) {
      dispatchByZone.set(zone, []);
    }
    dispatchByZone.get(zone).push(dispatchMin);
  }

  for (const [zone, values] of dispatchByZone.entries()) {
    const row = zonesMap.get(zone);
    if (row) {
      row.avgDispatchMin = Math.round(average(values));
    }
  }

  return Array.from(zonesMap.values()).map((row) => {
    const avgDispatchMin = row.avgDispatchMin || 0;
    return {
      ...row,
      avgDispatchMin,
      status: getStatusBadge(avgDispatchMin || 999)
    };
  });
}

function getWeekIndex(date, startDate) {
  const diffMs = date.getTime() - startDate.getTime();
  if (diffMs < 0) {
    return -1;
  }

  const days = Math.floor(diffMs / 86400000);
  return Math.min(3, Math.floor(days / 7));
}

export async function getTimelineAnalytics() {
  const { needs } = await getCollections();
  const end = new Date();
  const start = new Date(end.getTime() - 28 * 86400000);

  const buckets = [
    { week: "Week 1", newNeeds: 0, resolved: 0, escalated: 0 },
    { week: "Week 2", newNeeds: 0, resolved: 0, escalated: 0 },
    { week: "Week 3", newNeeds: 0, resolved: 0, escalated: 0 },
    { week: "Week 4", newNeeds: 0, resolved: 0, escalated: 0 }
  ];

  for (const need of needs) {
    const createdAt = toDate(need.createdAt || need.created_at || need.updatedAt);
    if (createdAt) {
      const idx = getWeekIndex(createdAt, start);
      if (idx >= 0) {
        buckets[idx].newNeeds += 1;
      }
    }

    const resolvedAt = toDate(need.resolvedAt || need.updatedAt || need.closedAt);
    if (isResolvedStatus(need.status) && resolvedAt) {
      const idx = getWeekIndex(resolvedAt, start);
      if (idx >= 0) {
        buckets[idx].resolved += 1;
      }
    }

    if (isEscalatedNeed(need) && createdAt) {
      const idx = getWeekIndex(createdAt, start);
      if (idx >= 0) {
        buckets[idx].escalated += 1;
      }
    }
  }

  return buckets;
}

export async function getVolunteerUtilizationAnalytics() {
  const { volunteers, assignments } = await getCollections();
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const result = labels.map((day) => ({ day, deployed: 0, available: 0 }));
  const totalVolunteers = volunteers.length || 16;

  const deployedByDay = new Map();
  for (const assignment of assignments) {
    const stamp = toDate(assignment.confirmedAt || assignment.generatedAt || assignment.createdAt);
    if (!stamp) continue;

    const dayLabel = labels[(stamp.getDay() + 6) % 7];
    if (!deployedByDay.has(dayLabel)) {
      deployedByDay.set(dayLabel, new Set());
    }
    const volunteerId = getAssignmentVolunteerId(assignment);
    if (volunteerId) {
      deployedByDay.get(dayLabel).add(volunteerId);
    }
  }

  for (const item of result) {
    const deployed = deployedByDay.get(item.day)?.size || 0;
    item.deployed = deployed;
    item.available = Math.max(0, totalVolunteers - deployed);
  }

  if (assignments.length === 0) {
    return [
      { day: "Mon", deployed: 10, available: 6 },
      { day: "Tue", deployed: 12, available: 4 },
      { day: "Wed", deployed: 11, available: 5 },
      { day: "Thu", deployed: 13, available: 3 },
      { day: "Fri", deployed: 14, available: 2 },
      { day: "Sat", deployed: 12, available: 4 },
      { day: "Sun", deployed: 9, available: 7 }
    ];
  }

  return result;
}

export async function getHeatmapAnalytics() {
  const { needs } = await getCollections();
  const zones = [...new Set([...ZONES, ...needs.map((need) => normalizeZone(need.locationName || need.location || need.zone))])];
  const categories = [...CATEGORIES];

  const raw = {};
  for (const zone of zones) {
    raw[zone] = {};
    for (const category of categories) {
      raw[zone][category] = [];
    }
  }

  for (const need of needs) {
    const zone = normalizeZone(need.locationName || need.location || need.zone);
    const category = normalizeCategory(need.category);
    const urgency = Math.max(0, Math.min(10, Number(need.urgencyScore || need.urgency || 0)));

    if (!raw[zone]) {
      raw[zone] = {};
      for (const key of categories) raw[zone][key] = [];
    }

    if (!raw[zone][category]) {
      raw[zone][category] = [];
    }

    raw[zone][category].push(urgency);
  }

  const matrix = {};
  for (const zone of zones) {
    matrix[zone] = {};
    for (const category of categories) {
      const values = raw[zone]?.[category] || [];
      matrix[zone][category] = values.length ? Math.round(average(values)) : 0;
    }
  }

  return {
    zones,
    categories,
    matrix
  };
}
