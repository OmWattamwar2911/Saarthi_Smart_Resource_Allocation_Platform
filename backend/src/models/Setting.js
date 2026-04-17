import mongoose from "mongoose";
import { ZONES } from "../config/constants.js";

const zoneSettingSchema = new mongoose.Schema(
  {
    zone: { type: String, enum: ZONES, required: true },
    active: { type: Boolean, default: true }
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    zones: { type: [zoneSettingSchema], default: [] },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true }
    },
    platformMode: { type: String, default: "Glass Command-Center" },
    theme: { type: String, enum: ["light", "dark"], default: "light" }
  },
  { timestamps: true }
);

export default mongoose.model("Setting", settingsSchema);
