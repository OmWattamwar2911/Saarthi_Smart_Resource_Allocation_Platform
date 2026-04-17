import Match from "../models/Match.js";
import Need from "../models/Need.js";
import Volunteer from "../models/Volunteer.js";
import { generateMatches } from "../services/aiMatchingService.js";
import { createNotificationPayload, emitEvent, logActivity } from "../services/notificationService.js";

export async function getMatches(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const data = await Match.find(filter)
      .populate("needId", "needId title urgency zone status")
      .populate("volunteerId", "volunteerId name role zone availability")
      .sort({ createdAt: -1 });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function generateMatchesController(req, res, next) {
  try {
    const matches = await generateMatches();
    const populated = await Match.find({ _id: { $in: matches.map((m) => m._id) } })
      .populate("needId", "needId title urgency zone status")
      .populate("volunteerId", "volunteerId name role zone availability")
      .sort({ createdAt: -1 });

    await logActivity({
      action: "AI Matching Generated",
      details: `${populated.length} matches generated`,
      entityType: "Match",
      entityId: populated[0]?.matchId || "batch",
      performedBy: req.user?.name || "District Command"
    });

    emitEvent("match:generated", {
      matches: populated,
      notification: createNotificationPayload(`${populated.length} new AI matches generated`, "info")
    });

    return res.status(201).json(populated);
  } catch (error) {
    return next(error);
  }
}

export async function confirmMatch(req, res, next) {
  try {
    const match = await Match.findOne({ matchId: req.params.id }).populate("needId volunteerId");
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    match.status = "Confirmed";
    match.confirmedAt = new Date();
    await match.save();

    await Need.findByIdAndUpdate(match.needId._id, {
      status: "Assigned",
      assignedVolunteerId: match.volunteerId._id,
      assignedTeam: match.suggestedTeam
    });

    await Volunteer.findByIdAndUpdate(match.volunteerId._id, {
      availability: "On Route",
      assignedNeedId: match.needId._id
    });

    await logActivity({
      action: "Match Confirmed",
      details: `${match.matchId} confirmed and dispatched`,
      entityType: "Match",
      entityId: match.matchId,
      performedBy: req.user?.name || "District Command"
    });

    emitEvent("need:updated", { needId: match.needId.needId, status: "Assigned" });
    emitEvent("volunteer:updated", { volunteerId: match.volunteerId.volunteerId, availability: "On Route" });
    emitEvent("match:generated", {
      matchId: match.matchId,
      status: "Confirmed",
      notification: createNotificationPayload(`Match confirmed - team dispatched (${match.eta} mins ETA)`, "success")
    });

    return res.json(match);
  } catch (error) {
    return next(error);
  }
}

export async function rejectMatch(req, res, next) {
  try {
    const match = await Match.findOneAndUpdate(
      { matchId: req.params.id },
      { status: "Rejected" },
      { new: true }
    );
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    await logActivity({
      action: "Match Rejected",
      details: `${match.matchId} rejected`,
      entityType: "Match",
      entityId: match.matchId,
      performedBy: req.user?.name || "District Command"
    });

    emitEvent("match:generated", {
      matchId: match.matchId,
      status: "Rejected",
      notification: createNotificationPayload(`Match ${match.matchId} rejected`, "error")
    });

    return res.json(match);
  } catch (error) {
    return next(error);
  }
}
