import mongoose from "mongoose";
import { REPORT_TYPES } from "../config/constants.js";

const reportSchema = new mongoose.Schema(
  {
    reportId: { type: String, unique: true, index: true },
    title: { type: String, required: true },
    owner: { type: String, required: true },
    type: { type: String, enum: REPORT_TYPES, default: "Impact" },
    content: { type: Object, default: {} },
    generatedAt: { type: Date, default: Date.now },
    lastUpdated: Date
  },
  { timestamps: false }
);

export default mongoose.model("Report", reportSchema);
