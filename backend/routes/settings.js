import express from "express";
import { auth } from "../src/middleware/auth.js";
import {
  clearAssignments,
  ensureSettings,
  forceSync,
  getSystemStatus,
  getUserId,
  resetMatchesToPending,
  resetSettings,
  saveSettings
} from "../services/settingsService.js";

const router = express.Router();

router.get("/", auth, async (req, res, next) => {
  try {
    const settings = await ensureSettings();
    return res.json(settings);
  } catch (error) {
    return next(error);
  }
});

router.post("/", auth, async (req, res, next) => {
  try {
    const settings = await saveSettings(req.body || {}, getUserId(req));
    return res.json({ success: true, settings });
  } catch (error) {
    return next(error);
  }
});

router.post("/reset", auth, async (req, res, next) => {
  try {
    const settings = await resetSettings(getUserId(req));
    return res.json({ success: true, settings });
  } catch (error) {
    return next(error);
  }
});

router.get("/status", auth, async (req, res, next) => {
  try {
    const status = await getSystemStatus();
    return res.json(status);
  } catch (error) {
    return next(error);
  }
});

router.post("/force-sync", auth, async (req, res, next) => {
  try {
    const result = await forceSync(getUserId(req));
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.post("/reset-matches", auth, async (req, res, next) => {
  try {
    const result = await resetMatchesToPending();
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.post("/clear-assignments", auth, async (req, res, next) => {
  try {
    const result = await clearAssignments(getUserId(req));
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

export default router;
