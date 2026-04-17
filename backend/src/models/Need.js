import mongoose from "mongoose";
import { NEED_CATEGORIES, NEED_STATUSES, ZONES } from "../config/constants.js";

const needSchema = new mongoose.Schema(
  {
    needId: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, enum: NEED_CATEGORIES, default: "Medical" },
    urgency: { type: Number, min: 1, max: 5, required: true },
    location: { type: String, required: true, trim: true },
    zone: { type: String, enum: ZONES, default: "Barmer Central" },
    status: { type: String, enum: NEED_STATUSES, default: "Open" },
    assignedVolunteerId: { type: mongoose.Schema.Types.ObjectId, ref: "Volunteer", default: null },
    assignedTeam: { type: String, trim: true },
    peopleAffected: { type: Number, default: 0 },
    contactName: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    notes: { type: String, trim: true },
    resolvedAt: Date
  },
  { timestamps: true }
);

needSchema.index({ status: 1, category: 1, urgency: -1, zone: 1 });

export default mongoose.model("Need", needSchema);