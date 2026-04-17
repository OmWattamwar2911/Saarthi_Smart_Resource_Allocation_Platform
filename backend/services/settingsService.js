import admin from "firebase-admin";
import { needsStore, volunteersStore } from "../src/utils/store.js";

export const DEFAULT_SETTINGS = {
  theme: "light",
  platformMode: "Normal",
  notifications: {
    desktopEnabled: true,
    smsAlerts: false,
    emailDigest: false,
    alertThreshold: 7,
    notificationEmail: ""
  },
  aiMatching: {
    autoGenerate: false,
    matchingPriority: "Balanced",
    minConfidenceThreshold: 50,
    requireConfirmation: true,
    maxEtaMinutes: 45
  },
  map: {
    defaultRegion: "Barmer District",
    showVolunteerLocations: true,
    showHeatmap: true,
    mapStyle: "Standard"
  },
  reports: {
    autoExport: "Never",
    exportEmail: "",
    retainResolvedData: true,
    retentionDays: 90
  },
  system: {
    maintenanceMode: false
  },
  updatedAt: null,
  updatedBy: "system"
};

let dbRef = null;
let useLocalFallback = false;

const localState = {
  settings: {
    ...DEFAULT_SETTINGS,
    updatedAt: new Date().toISOString(),
    updatedBy: "system"
  },
  system: {
    lastSync: null,
    lastSyncedBy: "system",
    maintenanceMode: false
  },
  assignments: [],
  activityLog: []
};

function normalizePrivateKey(value) {
  return String(value || "").replace(/\\n/g, "\n");
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

function nowTimestamp() {
  return admin.firestore.FieldValue.serverTimestamp();
}

function toSerializable(value) {
  if (!value) {
    return value;
  }

  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toSerializable(item));
  }

  if (typeof value === "object") {
    const output = {};
    Object.entries(value).forEach(([key, innerValue]) => {
      output[key] = toSerializable(innerValue);
    });
    return output;
  }

  return value;
}

function mergeWithDefaults(source = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...source,
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(source.notifications || {})
    },
    aiMatching: {
      ...DEFAULT_SETTINGS.aiMatching,
      ...(source.aiMatching || {})
    },
    map: {
      ...DEFAULT_SETTINGS.map,
      ...(source.map || {})
    },
    reports: {
      ...DEFAULT_SETTINGS.reports,
      ...(source.reports || {})
    },
    system: {
      ...DEFAULT_SETTINGS.system,
      ...(source.system || {})
    }
  };
}

export function getUserId(req) {
  return req?.user?.uid || req?.user?.id || "system";
}

export function validateSettings(payload) {
  const data = mergeWithDefaults(payload || {});

  const threshold = Number(data.notifications.alertThreshold);
  if (!Number.isFinite(threshold) || threshold < 1 || threshold > 10) {
    throw new Error("alertThreshold must be between 1 and 10");
  }

  const minConfidence = Number(data.aiMatching.minConfidenceThreshold);
  if (!Number.isFinite(minConfidence) || minConfidence < 0 || minConfidence > 100) {
    throw new Error("minConfidenceThreshold must be between 0 and 100");
  }

  const maxEta = Number(data.aiMatching.maxEtaMinutes);
  if (!Number.isFinite(maxEta) || maxEta <= 0) {
    throw new Error("maxEtaMinutes must be greater than 0");
  }

  const retention = Number(data.reports.retentionDays);
  if (!Number.isFinite(retention) || retention <= 0) {
    throw new Error("retentionDays must be greater than 0");
  }

  data.notifications.alertThreshold = threshold;
  data.aiMatching.minConfidenceThreshold = minConfidence;
  data.aiMatching.maxEtaMinutes = maxEta;
  data.reports.retentionDays = retention;

  return data;
}

export async function ensureSettings() {
  if (usingLocalFallback()) {
    return mergeWithDefaults(localState.settings);
  }

  const db = firestore();
  const ref = db.collection("settings").doc("global");
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      ...DEFAULT_SETTINGS,
      updatedAt: nowTimestamp()
    });
    const created = await ref.get();
    return toSerializable(mergeWithDefaults(created.data() || {}));
  }

  return toSerializable(mergeWithDefaults(snap.data() || {}));
}

async function writeActivityLog(type, payload = {}) {
  if (usingLocalFallback()) {
    localState.activityLog.push({
      type,
      timestamp: new Date().toISOString(),
      ...payload
    });
    return;
  }

  const db = firestore();
  await db.collection("activityLog").add({
    type,
    timestamp: nowTimestamp(),
    ...payload
  });
}

async function boostOpenNeedUrgency(triggeredBy) {
  if (usingLocalFallback()) {
    let updated = 0;
    for (const need of needsStore) {
      const urgencyScore = Number(need.urgencyScore ?? need.urgency ?? 0);
      if (String(need.status || "").toLowerCase() === "open" && urgencyScore < 8) {
        need.urgencyScore = 8;
        updated += 1;
      }
    }

    if (updated > 0) {
      await writeActivityLog("EMERGENCY_MODE_ACTIVATED", {
        triggeredBy,
        updatedNeeds: updated
      });
    }

    return updated;
  }

  const db = firestore();
  const openNeeds = await db.collection("needs").where("status", "==", "open").get();

  if (openNeeds.empty) {
    return 0;
  }

  let batch = db.batch();
  let opCount = 0;
  let updated = 0;

  for (const doc of openNeeds.docs) {
    const urgencyScore = Number(doc.data()?.urgencyScore || 0);
    if (urgencyScore >= 8) {
      continue;
    }

    batch.update(doc.ref, { urgencyScore: 8 });
    opCount += 1;
    updated += 1;

    if (opCount >= 400) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }

  if (updated > 0) {
    await writeActivityLog("EMERGENCY_MODE_ACTIVATED", {
      triggeredBy,
      updatedNeeds: updated
    });
  }

  return updated;
}

async function setSystemMaintenanceFlag(maintenanceMode) {
  if (usingLocalFallback()) {
    localState.system.maintenanceMode = Boolean(maintenanceMode);
    return;
  }

  const db = firestore();
  await db.collection("config").doc("system").set(
    {
      maintenanceMode: Boolean(maintenanceMode)
    },
    { merge: true }
  );
}

export async function saveSettings(payload, triggeredBy) {
  if (usingLocalFallback()) {
    const current = mergeWithDefaults(localState.settings);
    const incoming = validateSettings(payload);

    const platformModeChangedToEmergency =
      current.platformMode !== "Emergency" && incoming.platformMode === "Emergency";
    const maintenanceChanged =
      Boolean(current.system?.maintenanceMode) !== Boolean(incoming.system?.maintenanceMode);

    localState.settings = {
      ...incoming,
      updatedAt: new Date().toISOString(),
      updatedBy: triggeredBy
    };

    if (platformModeChangedToEmergency) {
      await boostOpenNeedUrgency(triggeredBy);
    }

    if (maintenanceChanged) {
      await setSystemMaintenanceFlag(incoming.system?.maintenanceMode);
    }

    return mergeWithDefaults(localState.settings);
  }

  const db = firestore();
  const ref = db.collection("settings").doc("global");
  const currentSnap = await ref.get();
  const current = mergeWithDefaults(currentSnap.exists ? currentSnap.data() || {} : {});
  const incoming = validateSettings(payload);

  const platformModeChangedToEmergency =
    current.platformMode !== "Emergency" && incoming.platformMode === "Emergency";
  const maintenanceChanged =
    Boolean(current.system?.maintenanceMode) !== Boolean(incoming.system?.maintenanceMode);

  await ref.set(
    {
      ...incoming,
      updatedAt: nowTimestamp(),
      updatedBy: triggeredBy
    },
    { merge: true }
  );

  if (platformModeChangedToEmergency) {
    await boostOpenNeedUrgency(triggeredBy);
  }

  if (maintenanceChanged) {
    await setSystemMaintenanceFlag(incoming.system?.maintenanceMode);
  }

  const updatedSnap = await ref.get();
  return toSerializable(mergeWithDefaults(updatedSnap.data() || {}));
}

export async function resetSettings(triggeredBy) {
  if (usingLocalFallback()) {
    localState.settings = {
      ...DEFAULT_SETTINGS,
      updatedAt: new Date().toISOString(),
      updatedBy: triggeredBy
    };

    await setSystemMaintenanceFlag(DEFAULT_SETTINGS.system.maintenanceMode);
    return mergeWithDefaults(localState.settings);
  }

  const db = firestore();
  const ref = db.collection("settings").doc("global");

  await ref.set(
    {
      ...DEFAULT_SETTINGS,
      updatedAt: nowTimestamp(),
      updatedBy: triggeredBy
    },
    { merge: false }
  );

  await setSystemMaintenanceFlag(DEFAULT_SETTINGS.system.maintenanceMode);

  const resetSnap = await ref.get();
  return toSerializable(mergeWithDefaults(resetSnap.data() || {}));
}

function formatRelativeTime(dateIso) {
  if (!dateIso) {
    return "Never";
  }

  const timestamp = new Date(dateIso).getTime();
  if (!Number.isFinite(timestamp)) {
    return "Unknown";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(seconds / 3600);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

async function getActiveSessions() {
  if (usingLocalFallback()) {
    return 1;
  }

  const db = firestore();
  const usersRef = db.collection("users");
  const oneUser = await usersRef.limit(1).get();

  if (oneUser.empty) {
    return 1;
  }

  const cutoffDate = new Date(Date.now() - 5 * 60 * 1000);
  const activeQuery = await usersRef.where("lastSeen", ">=", cutoffDate).get();

  return Math.max(1, activeQuery.size);
}

export async function getSystemStatus() {
  if (usingLocalFallback()) {
    const lastSyncIso = localState.system.lastSync || null;

    return {
      lastSync: lastSyncIso,
      lastSyncRelative: formatRelativeTime(lastSyncIso),
      activeSessions: 1,
      maintenanceMode: Boolean(localState.system.maintenanceMode),
      version: "v1.2.0"
    };
  }

  const db = firestore();
  const systemSnap = await db.collection("config").doc("system").get();
  const systemData = systemSnap.exists ? systemSnap.data() || {} : {};

  const lastSyncIso = toSerializable(systemData.lastSync) || null;

  return {
    lastSync: lastSyncIso,
    lastSyncRelative: formatRelativeTime(lastSyncIso),
    activeSessions: await getActiveSessions(),
    maintenanceMode: Boolean(systemData.maintenanceMode),
    version: "v1.2.0"
  };
}

export async function forceSync(triggeredBy) {
  if (usingLocalFallback()) {
    const syncedAt = new Date().toISOString();
    localState.system.lastSync = syncedAt;
    localState.system.lastSyncedBy = triggeredBy;

    const openNeeds = needsStore.filter((item) => String(item.status || "").toLowerCase() === "open").length;
    const availableVolunteers = volunteersStore.filter((item) => String(item.status || "").toLowerCase() === "available").length;

    return {
      success: true,
      syncedAt,
      openNeeds,
      availableVolunteers
    };
  }

  const db = firestore();
  const systemRef = db.collection("config").doc("system");

  await systemRef.set(
    {
      lastSync: nowTimestamp(),
      lastSyncedBy: triggeredBy
    },
    { merge: true }
  );

  const [openNeeds, availableVolunteers, updatedSystem] = await Promise.all([
    db.collection("needs").where("status", "==", "open").get(),
    db.collection("volunteers").where("isAvailable", "==", true).get(),
    systemRef.get()
  ]);

  return {
    success: true,
    syncedAt: toSerializable(updatedSystem.data()?.lastSync),
    openNeeds: openNeeds.size,
    availableVolunteers: availableVolunteers.size
  };
}

export async function resetMatchesToPending() {
  if (usingLocalFallback()) {
    let updated = 0;
    localState.assignments = localState.assignments.map((assignment) => {
      const status = String(assignment.status || "").toLowerCase();
      if (status === "confirmed") {
        return assignment;
      }
      updated += 1;
      return {
        ...assignment,
        status: "pending"
      };
    });
    return { success: true, updated };
  }

  const db = firestore();
  const assignments = await db.collection("assignments").get();
  if (assignments.empty) {
    return { success: true, updated: 0 };
  }

  let updated = 0;
  let opCount = 0;
  let batch = db.batch();

  for (const assignment of assignments.docs) {
    const status = String(assignment.data()?.status || "").toLowerCase();
    if (status === "confirmed") {
      continue;
    }

    batch.update(assignment.ref, { status: "pending" });
    opCount += 1;
    updated += 1;

    if (opCount >= 400) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }

  return { success: true, updated };
}

export async function clearAssignments(triggeredBy) {
  if (usingLocalFallback()) {
    const deleted = localState.assignments.length;
    localState.assignments = [];

    for (const volunteer of volunteersStore) {
      volunteer.status = "available";
      volunteer.currentTaskId = null;
    }

    for (const need of needsStore) {
      if (String(need.status || "").toLowerCase() === "in_progress") {
        need.status = "open";
      }
    }

    await writeActivityLog("ASSIGNMENTS_CLEARED", {
      triggeredBy
    });

    return { success: true, deleted };
  }

  const db = firestore();
  const assignments = await db.collection("assignments").get();
  const volunteers = await db.collection("volunteers").get();
  const inProgressNeeds = await db.collection("needs").where("status", "==", "in_progress").get();

  let deleted = 0;
  let opCount = 0;
  let batch = db.batch();

  for (const assignment of assignments.docs) {
    batch.delete(assignment.ref);
    deleted += 1;
    opCount += 1;

    if (opCount >= 400) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }

  for (const volunteer of volunteers.docs) {
    batch.set(
      volunteer.ref,
      {
        isAvailable: true,
        currentTaskId: null
      },
      { merge: true }
    );
    opCount += 1;

    if (opCount >= 400) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }

  for (const need of inProgressNeeds.docs) {
    batch.set(
      need.ref,
      {
        status: "open"
      },
      { merge: true }
    );
    opCount += 1;

    if (opCount >= 400) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }

  await writeActivityLog("ASSIGNMENTS_CLEARED", {
    triggeredBy
  });

  return { success: true, deleted };
}
