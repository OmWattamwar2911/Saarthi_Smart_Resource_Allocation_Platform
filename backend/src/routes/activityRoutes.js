import express from "express";
import { getActivityLogs } from "../controllers/activityController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getActivityLogs);

export default router;
