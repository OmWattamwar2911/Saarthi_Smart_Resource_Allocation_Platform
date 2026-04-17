import ActivityLog from "../models/ActivityLog.js";

let ioRef = null;
const ANALYTICS_TRIGGER_EVENTS = new Set([
  "need:created",
  "need:updated",
  "volunteer:updated",
  "match:generated",
  "alert:new"
]);

export function setIo(io) {
  ioRef = io;
}

export async function logActivity({ action, details, entityType, entityId, performedBy = "District Command", metadata = {} }) {
  await ActivityLog.create({
    action,
    details,
    entityType,
    entityId,
    performedBy,
    metadata
  });
}

export function emitEvent(event, payload) {
  if (ioRef) {
    ioRef.emit(event, payload);

    if (ANALYTICS_TRIGGER_EVENTS.has(event)) {
      ioRef.emit("analytics:update", {
        sourceEvent: event,
        timestamp: new Date().toISOString()
      });
    }
  }
}

export function createNotificationPayload(message, type = "info") {
  return {
    id: `${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    type,
    message,
    timestamp: new Date().toISOString()
  };
}
