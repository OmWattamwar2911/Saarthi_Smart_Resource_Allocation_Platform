import express from "express";
import {
  getAnalyticsSummary,
  getHeatmapAnalytics,
  getTimelineAnalytics,
  getVolunteerUtilizationAnalytics,
  getZoneAnalytics
} from "../services/analyticsService.js";
import { generateGeminiInsights } from "../services/geminiInsights.js";

const router = express.Router();

router.get("/summary", async (req, res, next) => {
  try {
    const summary = await getAnalyticsSummary();
    return res.json(summary);
  } catch (error) {
    return next(error);
  }
});

router.get("/zones", async (req, res, next) => {
  try {
    const zones = await getZoneAnalytics();
    return res.json(zones);
  } catch (error) {
    return next(error);
  }
});

router.get("/timeline", async (req, res, next) => {
  try {
    const timeline = await getTimelineAnalytics();
    return res.json(timeline);
  } catch (error) {
    return next(error);
  }
});

router.get("/volunteer-utilization", async (req, res, next) => {
  try {
    const utilization = await getVolunteerUtilizationAnalytics();
    return res.json(utilization);
  } catch (error) {
    return next(error);
  }
});

router.get("/heatmap", async (req, res, next) => {
  try {
    const heatmap = await getHeatmapAnalytics();
    return res.json(heatmap);
  } catch (error) {
    return next(error);
  }
});

router.post("/insights", async (req, res, next) => {
  try {
    const [summary, zones, timeline, utilization, heatmap] = await Promise.all([
      getAnalyticsSummary(),
      getZoneAnalytics(),
      getTimelineAnalytics(),
      getVolunteerUtilizationAnalytics(),
      getHeatmapAnalytics()
    ]);

    const insights = await generateGeminiInsights({
      summary,
      zones,
      timeline,
      utilization,
      heatmap
    });

    return res.json(insights);
  } catch (error) {
    return next(error);
  }
});

export default router;
