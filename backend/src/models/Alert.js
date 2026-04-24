import mongoose from "mongoose";
import { ALERT_SEVERITIES, ALERT_STATUSES, ZONES } from "../config/constants.js";

const alertSchema = new mongoose.Schema(
  {
    alertId: { type: String, unique: true, index: true },
    message: { type: String, required: true, trim: true },
    severity: { type: String, enum: ALERT_SEVERITIES, default: "Moderate" },
    zone: { type: String, enum: ZONES, default: "Barmer Central" },
    priorityScore: { type: Number, min: 1, max: 100, default: 50 },
    priorityReason: { type: String, trim: true, default: "Standard queue processing" },
    recommendedAction: { type: String, trim: true, default: "Monitor and coordinate with local response unit." },
    status: { type: String, enum: ALERT_STATUSES, default: "Active" },
    escalatedAt: Date,
    resolvedAt: Date
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("Alert", alertSchema);
