import ActivityLog from "../models/ActivityLog.js";

let ioRef = null;

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
