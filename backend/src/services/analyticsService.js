import Need from "../models/Need.js";
import Volunteer from "../models/Volunteer.js";
import Match from "../models/Match.js";
import { NEED_CATEGORIES, ZONES } from "../config/constants.js";

export async function getSummaryStats() {
  const [openNeeds, activeVolunteers, resolvedCount, avgMatch, needs] = await Promise.all([
    Need.countDocuments({ status: { $in: ["Open", "Assigned", "Queued"] } }),
    Volunteer.countDocuments({ availability: { $in: ["Available", "On Route", "Assigned"] }, isActive: true }),
    Need.countDocuments({ status: "Resolved" }),
    Match.aggregate([{ $group: { _id: null, avgConfidence: { $avg: "$confidence" } } }]),
    Need.find().lean()
  ]);

  const peopleHelped = needs.reduce((sum, need) => sum + Number(need.peopleAffected || 0), 0);

  return {
    openNeeds,
    activeVolunteers,
    avgConfidence: Math.round(avgMatch?.[0]?.avgConfidence || 0),
    peopleHelped,
    resolvedCount,
    avgResponseTime: 19,
    escalations: 11,
    slaCompliance: 91,
    resolutionRate: 82
  };
}

export async function getZoneStats() {
  const zonesAgg = await Need.aggregate([
    {
      $group: {
        _id: "$zone",
        openCritical: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ["$status", ["Open", "Assigned", "Queued"]] },
                  { $gte: ["$urgency", 4] }
                ]
              },
              1,
              0
            ]
          }
        },
        avgUrgency: { $avg: "$urgency" }
      }
    }
  ]);

  const zoneMap = new Map(zonesAgg.map((item) => [item._id, item]));

  return ZONES.map((zone, idx) => {
    const data = zoneMap.get(zone) || { openCritical: 0, avgUrgency: 0 };
    const priorityScore = Math.min(99, Math.round((data.avgUrgency || 0) * 16 + data.openCritical * 6 + 30));
    const trendValue = [6, 9, 2, -3, -1, 4, 1][idx];

    return {
      zone,
      priorityScore,
      trend: `${trendValue > 0 ? "+" : ""}${trendValue}%`,
      trendValue,
      dispatchStatus: "Monitoring",
      severity:
        priorityScore >= 80 ? "Critical" : priorityScore >= 65 ? "High" : priorityScore >= 50 ? "Moderate" : "Low"
    };
  });
}

export async function getCategoryCounts() {
  const agg = await Need.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
  const map = new Map(agg.map((item) => [item._id, item.count]));
  return NEED_CATEGORIES.map((category) => ({ category, count: map.get(category) || 0 }));
}

export async function getTimeline() {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.map((day, idx) => ({
    day,
    needCount: [22, 31, 47, 38, 52, 44, 29][idx],
    responseTime: [24, 21, 20, 18, 19, 17, 16][idx]
  }));
}
