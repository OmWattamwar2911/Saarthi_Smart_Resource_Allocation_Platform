import { getCategoryCounts, getSummaryStats, getTimeline, getZoneStats } from "../services/analyticsService.js";

export async function getSummary(req, res, next) {
  try {
    const summary = await getSummaryStats();
    return res.json(summary);
  } catch (error) {
    return next(error);
  }
}

export async function getZones(req, res, next) {
  try {
    const data = await getZoneStats();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function getCategories(req, res, next) {
  try {
    const data = await getCategoryCounts();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function getTimelineData(req, res, next) {
  try {
    const data = await getTimeline();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}
