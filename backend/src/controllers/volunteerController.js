import { nextId, volunteersStore } from "../utils/store.js";

export const getVolunteers = async (req, res) => {
	const { status } = req.query;
	const volunteers = status
		? volunteersStore.filter((volunteer) => volunteer.status === status)
		: volunteersStore;

	res.json(volunteers);
};

export const createVolunteer = async (req, res) => {
	const { name, skills = "General", area = "Barmer", status = "available" } = req.body || {};
	if (!name) {
		return res.status(400).json({ error: "name is required" });
	}

	const initials = name
		.split(" ")
		.filter(Boolean)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	const volunteer = {
		id: nextId(volunteersStore),
		name,
		initials,
		skills,
		area,
		tasks: 0,
		xp: 0,
		status
	};

	volunteersStore.push(volunteer);
	res.status(201).json(volunteer);
};
