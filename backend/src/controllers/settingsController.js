import Setting from "../models/Setting.js";
import { DEFAULT_SETTINGS } from "../config/constants.js";
import { logActivity } from "../services/notificationService.js";

async function ensureSettings() {
  let settings = await Setting.findOne({ key: "global" });
  if (!settings) {
    settings = await Setting.create({ key: "global", ...DEFAULT_SETTINGS });
  }
  return settings;
}

export async function getSettings(req, res, next) {
  try {
    const settings = await ensureSettings();
    return res.json(settings);
  } catch (error) {
    return next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const settings = await ensureSettings();
    const payload = req.body || {};

    if (payload.notifications) settings.notifications = payload.notifications;
    if (payload.platformMode) settings.platformMode = payload.platformMode;
    if (payload.theme) settings.theme = payload.theme;
    if (payload.zones) settings.zones = payload.zones;

    await settings.save();

    await logActivity({
      action: "Settings Updated",
      details: "Platform settings updated",
      entityType: "Setting",
      entityId: settings.key,
      performedBy: req.user?.name || "District Command"
    });

    return res.json(settings);
  } catch (error) {
    return next(error);
  }
}

export async function updateZones(req, res, next) {
  try {
    const settings = await ensureSettings();
    settings.zones = req.body?.zones || settings.zones;
    await settings.save();

    await logActivity({
      action: "Zones Updated",
      details: "Zone activation map changed",
      entityType: "Setting",
      entityId: settings.key,
      performedBy: req.user?.name || "District Command"
    });

    return res.json(settings);
  } catch (error) {
    return next(error);
  }
}

export async function resetSettings(req, res, next) {
  try {
    const settings = await ensureSettings();
    settings.zones = DEFAULT_SETTINGS.zones;
    settings.notifications = DEFAULT_SETTINGS.notifications;
    settings.platformMode = DEFAULT_SETTINGS.platformMode;
    settings.theme = DEFAULT_SETTINGS.theme;
    await settings.save();

    await logActivity({
      action: "Settings Reset",
      details: "Platform settings reset to defaults",
      entityType: "Setting",
      entityId: settings.key,
      performedBy: req.user?.name || "District Command"
    });

    return res.json(settings);
  } catch (error) {
    return next(error);
  }
}
