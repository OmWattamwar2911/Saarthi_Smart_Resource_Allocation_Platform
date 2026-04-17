import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    details: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    performedBy: { type: String, default: "District Command" },
    metadata: { type: Object, default: {} },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

activityLogSchema.index({ timestamp: -1 });

export default mongoose.model("ActivityLog", activityLogSchema);
