import ActivityLog from "../models/ActivityLog.js";

export async function getActivityLogs(req, res, next) {
  try {
    const { limit = 50, type, from, to } = req.query;
    const filter = {};

    if (type) {
      filter.action = { $regex: type, $options: "i" };
    }

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(Math.min(Number(limit) || 50, 200));

    return res.json(logs);
  } catch (error) {
    return next(error);
  }
}
