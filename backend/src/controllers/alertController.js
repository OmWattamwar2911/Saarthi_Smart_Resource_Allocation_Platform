import Alert from "../models/Alert.js";
import { generateNextId } from "../utils/generateId.js";
import { createNotificationPayload, emitEvent, logActivity } from "../services/notificationService.js";

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

    const alert = await Alert.create({
      alertId: await generateNextId(Alert, "alertId", "AL"),
      message,
      severity,
      zone,
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
