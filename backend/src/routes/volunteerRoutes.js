import express from "express";
import { createVolunteer, getVolunteers } from "../controllers/volunteerController.js";

const router = express.Router();

router.get("/", getVolunteers);
router.post("/", createVolunteer);

export default router;
