import express from "express";
import {
	createVolunteer,
	deleteVolunteer,
	getVolunteerById,
	getVolunteers,
	updateAvailability,
	updateVolunteer
} from "../controllers/volunteerController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getVolunteers);
router.get("/:id", getVolunteerById);
router.post("/", auth, createVolunteer);
router.patch("/:id", auth, updateVolunteer);
router.delete("/:id", auth, deleteVolunteer);
router.patch("/:id/availability", auth, updateAvailability);

export default router;
