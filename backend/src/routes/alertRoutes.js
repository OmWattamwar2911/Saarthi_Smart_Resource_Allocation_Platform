import express from "express";
import { createAlert, escalateAlert, getAlerts, resolveAlert } from "../controllers/alertController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAlerts);
router.post("/", auth, createAlert);
router.patch("/:id/escalate", auth, escalateAlert);
router.patch("/:id/resolve", auth, resolveAlert);

export default router;
