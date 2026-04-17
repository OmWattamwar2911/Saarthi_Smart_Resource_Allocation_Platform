import mongoose from "mongoose";
import { VOLUNTEER_AVAILABILITY, VOLUNTEER_ROLES, ZONES } from "../config/constants.js";

const volunteerSchema = new mongoose.Schema(
	{
		volunteerId: { type: String, unique: true, index: true },
		name: { type: String, required: true, trim: true },
		role: { type: String, enum: VOLUNTEER_ROLES, default: "Coordinator" },
		skills: { type: [String], default: [] },
		zone: { type: String, enum: ZONES, default: "Barmer Central" },
		availability: { type: String, enum: VOLUNTEER_AVAILABILITY, default: "Available" },
		rating: { type: Number, min: 1, max: 5, default: 5 },
		xp: { type: Number, default: 0 },
		tasksCompleted: { type: Number, default: 0 },
		phone: String,
		email: String,
		assignedNeedId: { type: mongoose.Schema.Types.ObjectId, ref: "Need", default: null },
		joinedAt: { type: Date, default: Date.now },
		avatar: String,
		isActive: { type: Boolean, default: true }
	},
	{ timestamps: true }
);

volunteerSchema.index({ availability: 1, zone: 1, role: 1 });

export default mongoose.model("Volunteer", volunteerSchema);
