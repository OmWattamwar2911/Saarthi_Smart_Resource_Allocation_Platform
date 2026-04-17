import express from "express";
import { getCategories, getSummary, getTimelineData, getZones } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/summary", getSummary);
router.get("/zones", getZones);
router.get("/categories", getCategories);
router.get("/timeline", getTimelineData);

export default router;
