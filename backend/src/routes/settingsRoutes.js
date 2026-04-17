import express from "express";
import { getSettings, resetSettings, updateSettings, updateZones } from "../controllers/settingsController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getSettings);
router.patch("/", auth, updateSettings);
router.patch("/zones", auth, updateZones);
router.post("/reset", auth, resetSettings);

export default router;
