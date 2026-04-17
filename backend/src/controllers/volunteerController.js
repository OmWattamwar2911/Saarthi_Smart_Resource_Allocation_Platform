import Volunteer from "../models/Volunteer.js";
import { generateNextId } from "../utils/generateId.js";
import { emitEvent, logActivity } from "../services/notificationService.js";

const AVAILABILITY_ALIASES = {
	Unavailable: "Off Duty",
	"Off-Duty": "Off Duty",
	"On-Route": "On Route"
};

function normalizeAvailability(value) {
	if (!value) return value;
	return AVAILABILITY_ALIASES[value] || value;
}

function getInitials(name = "") {
	return name
		.split(" ")
		.filter(Boolean)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

export async function getVolunteers(req, res, next) {
	try {
		const filter = { isActive: true };
		const { availability, zone, role, search, sort = "name", limit = 0 } = req.query;
		if (availability) filter.availability = availability;
		if (zone) filter.zone = zone;
		if (role) filter.role = role;
		if (search) filter.name = { $regex: search, $options: "i" };

		const sortMap = { name: { name: 1 }, rating: { rating: -1 }, xp: { xp: -1 }, zone: { zone: 1 } };
		const data = await Volunteer.find(filter).sort(sortMap[sort] || sortMap.name).limit(Number(limit) || 0);
		return res.json(data);
	} catch (error) {
		return next(error);
	}
}

export async function getVolunteerById(req, res, next) {
	try {
		const volunteer = await Volunteer.findOne({ volunteerId: req.params.id }).populate(
			"assignedNeedId",
			"needId title status zone urgency"
		);
		if (!volunteer) {
			return res.status(404).json({ error: "Volunteer not found" });
		}
		return res.json(volunteer);
	} catch (error) {
		return next(error);
	}
}

export async function createVolunteer(req, res, next) {
	try {
		const payload = req.body || {};
		if (!payload.name) {
			return res.status(400).json({ error: "name is required" });
		}

		const volunteer = await Volunteer.create({
			volunteerId: await generateNextId(Volunteer, "volunteerId", "V"),
			name: payload.name,
			role: payload.role,
			skills: Array.isArray(payload.skills) ? payload.skills : String(payload.skills || "").split(",").map((s) => s.trim()).filter(Boolean),
			zone: payload.zone,
			availability: payload.availability || "Available",
			rating: Number(payload.rating || 5),
			xp: Number(payload.xp || 0),
			tasksCompleted: Number(payload.tasksCompleted || 0),
			phone: payload.phone,
			email: payload.email,
			avatar: payload.avatar || getInitials(payload.name)
		});

		await logActivity({
			action: "Volunteer Added",
			details: `${volunteer.volunteerId} registered`,
			entityType: "Volunteer",
			entityId: volunteer.volunteerId,
			performedBy: req.user?.name || "District Command"
		});

		emitEvent("volunteer:updated", volunteer);
		return res.status(201).json(volunteer);
	} catch (error) {
		return next(error);
	}
}

export async function updateVolunteer(req, res, next) {
	try {
		const volunteer = await Volunteer.findOneAndUpdate({ volunteerId: req.params.id }, req.body || {}, {
			new: true,
			runValidators: true
		});
		if (!volunteer) {
			return res.status(404).json({ error: "Volunteer not found" });
		}

		await logActivity({
			action: "Volunteer Updated",
			details: `${volunteer.volunteerId} profile updated`,
			entityType: "Volunteer",
			entityId: volunteer.volunteerId,
			performedBy: req.user?.name || "District Command"
		});

		emitEvent("volunteer:updated", volunteer);
		return res.json(volunteer);
	} catch (error) {
		return next(error);
	}
}

export async function deleteVolunteer(req, res, next) {
	try {
		const volunteer = await Volunteer.findOneAndUpdate(
			{ volunteerId: req.params.id },
			{ isActive: false, availability: "Off Duty" },
			{ new: true }
		);
		if (!volunteer) {
			return res.status(404).json({ error: "Volunteer not found" });
		}

		await logActivity({
			action: "Volunteer Removed",
			details: `${volunteer.volunteerId} set inactive`,
			entityType: "Volunteer",
			entityId: volunteer.volunteerId,
			performedBy: req.user?.name || "District Command"
		});

		emitEvent("volunteer:updated", volunteer);
		return res.json({ ok: true });
	} catch (error) {
		return next(error);
	}
}

export async function updateAvailability(req, res, next) {
	try {
		const { status } = req.body || {};
		if (!status) {
			return res.status(400).json({ error: "status is required" });
		}

		const normalizedStatus = normalizeAvailability(status);
		const volunteer = await Volunteer.findOneAndUpdate(
			{ volunteerId: req.params.id },
			{ availability: normalizedStatus },
			{ new: true, runValidators: true }
		);
		if (!volunteer) {
			return res.status(404).json({ error: "Volunteer not found" });
		}

		await logActivity({
			action: "Volunteer Availability Updated",
			details: `${volunteer.volunteerId} set to ${volunteer.availability}`,
			entityType: "Volunteer",
			entityId: volunteer.volunteerId,
			performedBy: req.user?.name || "District Command"
		});

		emitEvent("volunteer:updated", volunteer);
		return res.json(volunteer);
	} catch (error) {
		return next(error);
	}
}
