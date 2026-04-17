import mongoose from "mongoose";
import { MATCH_STATUSES } from "../config/constants.js";

const matchSchema = new mongoose.Schema(
  {
    matchId: { type: String, unique: true, index: true },
    needId: { type: mongoose.Schema.Types.ObjectId, ref: "Need", required: true },
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: "Volunteer", required: true },
    suggestedTeam: { type: String, required: true },
    eta: { type: Number, required: true },
    confidence: { type: Number, min: 0, max: 100, required: true },
    reasoning: String,
    status: { type: String, enum: MATCH_STATUSES, default: "Pending" },
    confirmedAt: Date
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("Match", matchSchema);
