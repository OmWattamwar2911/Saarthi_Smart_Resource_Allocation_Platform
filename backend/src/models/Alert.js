import mongoose from "mongoose";
import { ALERT_SEVERITIES, ALERT_STATUSES, ZONES } from "../config/constants.js";

const alertSchema = new mongoose.Schema(
  {
    alertId: { type: String, unique: true, index: true },
    message: { type: String, required: true, trim: true },
    severity: { type: String, enum: ALERT_SEVERITIES, default: "Moderate" },
    zone: { type: String, enum: ZONES, default: "Barmer Central" },
    status: { type: String, enum: ALERT_STATUSES, default: "Active" },
    escalatedAt: Date,
    resolvedAt: Date
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("Alert", alertSchema);
