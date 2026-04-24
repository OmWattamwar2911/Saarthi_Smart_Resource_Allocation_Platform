import Need from "../models/Need.js";
import Volunteer from "../models/Volunteer.js";
import Match from "../models/Match.js";
import { ADJACENT_ZONE_MAP } from "../config/constants.js";
import { generateNextId } from "../utils/generateId.js";
import { generateNeedVolunteerAssignments } from "./vertexAIService.js";

function includesSkill(volunteerSkills = [], category = "") {
  const cat = String(category).toLowerCase();
  return volunteerSkills.some((skill) => String(skill).toLowerCase().includes(cat));
}

function proximityScore(needZone, volunteerZone) {
  if (!needZone || !volunteerZone) return { score: 5, tier: "far" };
  if (needZone === volunteerZone) return { score: 30, tier: "same" };
  if ((ADJACENT_ZONE_MAP[needZone] || []).includes(volunteerZone)) return { score: 15, tier: "adjacent" };
  return { score: 5, tier: "far" };
}

function randomEta(tier) {
  if (tier === "same") return 15 + Math.floor(Math.random() * 6);
  if (tier === "adjacent") return 25 + Math.floor(Math.random() * 11);
  return 40 + Math.floor(Math.random() * 21);
}

function pickHeuristicWinner(need, volunteers) {
  const scored = volunteers.map((volunteer) => {
    const skillMatch = includesSkill(volunteer.skills, need.category) ? 40 : 0;
    const proximity = proximityScore(need.zone, volunteer.zone);
    const availabilityScore = volunteer.availability === "Available" ? 20 : 5;
    const ratingBonus = (Number(volunteer.rating || 3) - 3) * 5;
    const totalScore = skillMatch + proximity.score + availabilityScore + ratingBonus;

    return {
      volunteer,
      totalScore,
      proximity
    };
  });

  scored.sort((a, b) => b.totalScore - a.totalScore);
  const winner = scored[0];

  return {
    volunteer: winner.volunteer,
    eta: randomEta(winner.proximity.tier),
    confidence: Math.min(95, Math.round(winner.totalScore)),
    reasoning: `${winner.volunteer.name} selected due to skill fit (${need.category}), zone proximity, and ${winner.volunteer.availability.toLowerCase()} availability.`
  };
}

function parseEtaMinutes(etaText, fallback) {
  const raw = String(etaText || "");
  const match = raw.match(/\d+/);
  if (match) {
    return Number(match[0]);
  }
  return fallback;
}

export async function generateMatches() {
  const needs = await Need.find({ status: "Open" }).sort({ urgency: -1, createdAt: 1 });
  const volunteers = await Volunteer.find({ availability: { $in: ["Available", "On Route"] }, isActive: true });

  const createdMatches = [];

  const aiNeeds = needs.map((need) => ({
    needId: need.needId,
    title: need.title,
    description: need.description,
    category: need.category,
    urgency: need.urgency,
    zone: need.zone,
    location: need.location
  }));

  const aiVolunteers = volunteers.map((volunteer) => ({
    volunteerId: volunteer.volunteerId,
    name: volunteer.name,
    role: volunteer.role,
    skills: volunteer.skills,
    zone: volunteer.zone,
    availability: volunteer.availability,
    rating: volunteer.rating,
    xp: volunteer.xp
  }));

  const needByCode = new Map(needs.map((need) => [need.needId, need]));
  const volunteerByCode = new Map(volunteers.map((volunteer) => [volunteer.volunteerId, volunteer]));

  let aiAssignments = [];
  try {
    aiAssignments = await generateNeedVolunteerAssignments(aiNeeds, aiVolunteers);
  } catch (error) {
    console.warn("AI matching unavailable, switching to heuristic selection.", error?.message || error);
  }

  const assignmentByNeedId = new Map(
    aiAssignments
      .filter((assignment) => assignment?.needId && assignment?.volunteerId)
      .map((assignment) => [String(assignment.needId), assignment])
  );

  for (const need of needs) {
    if (!volunteers.length) break;

    const aiAssignment = assignmentByNeedId.get(String(need.needId));
    const aiVolunteer = aiAssignment ? volunteerByCode.get(String(aiAssignment.volunteerId)) : null;

    const fallback = pickHeuristicWinner(need, volunteers);
    const selectedVolunteer = aiVolunteer || fallback.volunteer;
    const confidence = Math.min(
      100,
      Math.max(1, Number(aiAssignment?.confidenceScore || fallback.confidence))
    );
    const eta = parseEtaMinutes(aiAssignment?.eta, fallback.eta);
    const reasoning = aiAssignment?.reasoning || fallback.reasoning;
    const teamName = aiAssignment?.teamName || `${selectedVolunteer.role} Team - ${selectedVolunteer.zone}`;

    const newMatch = await Match.create({
      matchId: await generateNextId(Match, "matchId", "M"),
      needId: need._id,
      volunteerId: selectedVolunteer._id,
      suggestedTeam: teamName,
      eta,
      confidence,
      reasoning,
      status: "Pending"
    });

    createdMatches.push(newMatch);
  }

  return createdMatches;
}
