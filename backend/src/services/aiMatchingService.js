import Need from "../models/Need.js";
import Volunteer from "../models/Volunteer.js";
import Match from "../models/Match.js";
import { ADJACENT_ZONE_MAP } from "../config/constants.js";
import { generateNextId } from "../utils/generateId.js";

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

export async function generateMatches() {
  const needs = await Need.find({ status: "Open" }).sort({ urgency: -1, createdAt: 1 });
  const volunteers = await Volunteer.find({ availability: { $in: ["Available", "On Route"] }, isActive: true });

  const createdMatches = [];

  for (const need of needs) {
    if (!volunteers.length) break;

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
    const confidence = Math.min(95, Math.round(winner.totalScore));
    const eta = randomEta(winner.proximity.tier);

    const newMatch = await Match.create({
      matchId: await generateNextId(Match, "matchId", "M"),
      needId: need._id,
      volunteerId: winner.volunteer._id,
      suggestedTeam: `${winner.volunteer.role} Team - ${winner.volunteer.zone}`,
      eta,
      confidence,
      reasoning: `${winner.volunteer.name} selected due to skill fit (${need.category}), zone proximity, and ${winner.volunteer.availability.toLowerCase()} availability.`,
      status: "Pending"
    });

    createdMatches.push(newMatch);
  }

  return createdMatches;
}
