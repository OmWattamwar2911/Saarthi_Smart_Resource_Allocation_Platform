import Alert from "../models/Alert.js";
import { generateNextId } from "../utils/generateId.js";
import { createNotificationPayload, emitEvent, logActivity } from "../services/notificationService.js";
import { generateJsonWithFallback } from "../services/vertexAIService.js";

function normalizeQueryValue(value) {
  const text = String(value || "").trim();
  if (!text || text.toLowerCase() === "all") {
    return "";
  }
  return text;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fallbackPriority({ severity, message }) {
  const severityScore =
    severity === "Critical" ? 95 : severity === "High" ? 82 : severity === "Moderate" ? 64 : 42;
  const msg = String(message || "").toLowerCase();
  const keywordBoost =
    (msg.includes("medical") ? 6 : 0) +
    (msg.includes("flood") ? 5 : 0) +
    (msg.includes("rescue") ? 7 : 0);
  const score = Math.min(100, severityScore + keywordBoost);

  return {
    priorityScore: score,
    priorityReason: "Priority derived from severity and operational keywords.",
    recommendedAction:
      score >= 85
        ? "Dispatch nearest available team immediately and notify district command."
        : "Assign zone coordinator for verification and response planning."
  };
}

async function getAIPriority({ message, severity, zone }) {
  const prompt = `Given this alert, return JSON only:\n\n${JSON.stringify(
    { message, severity, zone },
    null,
    2
  )}\n\nSchema:\n{\n  "priorityScore": 1-100,\n  "reason": "short reason",\n  "recommendedAction": "specific action"\n}`;

  try {
    // Prompt logic: enforce tight schema so output can be stored directly on the Alert model.
    const data = await generateJsonWithFallback({
      prompt,
      systemPrompt: "You are an emergency triage assistant for disaster alerts. Return strict JSON.",
      temperature: 0.2,
      maxOutputTokens: 500
    });

    return {
      priorityScore: Math.min(100, Math.max(1, Number(data?.priorityScore || 50))),
      priorityReason: String(data?.reason || "AI prioritization applied").slice(0, 240),
      recommendedAction: String(data?.recommendedAction || "Coordinate immediate field verification.").slice(0, 280)
    };
  } catch {
    return fallbackPriority({ message, severity });
  }
}

export async function getAlerts(req, res, next) {
  try {
    const filter = {};
    const severityValue = normalizeQueryValue(req.query.severity);
    const statusValue = normalizeQueryValue(req.query.status);
    const zoneValue = normalizeQueryValue(req.query.zone);
    const searchValue = normalizeQueryValue(req.query.search);
    const limit = Number(req.query.limit) || 0;

    if (severityValue) filter.severity = severityValue;
    if (statusValue) filter.status = statusValue;
    if (zoneValue) filter.zone = zoneValue;
    if (searchValue) {
      const regex = new RegExp(escapeRegex(searchValue), "i");
      filter.$or = [{ message: regex }, { alertId: regex }, { zone: regex }];
    }

    const data = await Alert.find(filter).sort({ createdAt: -1 }).limit(limit);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function createAlert(req, res, next) {
  try {
    const { message, severity = "Moderate", zone = "Barmer Central" } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const aiPriority = await getAIPriority({ message, severity, zone });

    const alert = await Alert.create({
      alertId: await generateNextId(Alert, "alertId", "AL"),
      message,
      severity,
      zone,
      priorityScore: aiPriority.priorityScore,
      priorityReason: aiPriority.priorityReason,
      recommendedAction: aiPriority.recommendedAction,
      status: "Active"
    });

    await logActivity({
      action: "Alert Created",
      details: `${alert.alertId} created (${alert.severity})`,
      entityType: "Alert",
      entityId: alert.alertId,
      performedBy: req.user?.name || "District Command"
    });

    emitEvent("alert:new", { alert, notification: createNotificationPayload(`New ${alert.severity} alert in ${alert.zone}`) });
    return res.status(201).json(alert);
  } catch (error) {
    return next(error);
  }
}

export async function escalateAlert(req, res, next) {
  try {
    const alert = await Alert.findOneAndUpdate(
      { alertId: req.params.id },
      { status: "Escalated", escalatedAt: new Date() },
      { new: true }
    );
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    await logActivity({
      action: "Alert Escalated",
      details: `${alert.alertId} escalated`,
      entityType: "Alert",
      entityId: alert.alertId,
      performedBy: req.user?.name || "District Command"
    });

    emitEvent("alert:new", { alert, notification: createNotificationPayload(`Alert ${alert.alertId} escalated`, "error") });
    return res.json(alert);
  } catch (error) {
    return next(error);
  }
}

export async function resolveAlert(req, res, next) {
  try {
    const alert = await Alert.findOneAndUpdate(
      { alertId: req.params.id },
      { status: "Resolved", resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    await logActivity({
      action: "Alert Resolved",
      details: `${alert.alertId} resolved`,
      entityType: "Alert",
      entityId: alert.alertId,
      performedBy: req.user?.name || "District Command"
    });

    emitEvent("alert:new", { alert, notification: createNotificationPayload(`Alert ${alert.alertId} resolved`, "success") });
    return res.json(alert);
  } catch (error) {
    return next(error);
  }
}
