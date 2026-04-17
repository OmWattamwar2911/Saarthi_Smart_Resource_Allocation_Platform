import Need from "../models/Need.js";
import Volunteer from "../models/Volunteer.js";
import { generateNextId } from "../utils/generateId.js";
import { emitEvent, logActivity } from "../services/notificationService.js";

function buildNeedQuery(query) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.zone) filter.zone = query.zone;
  if (query.urgency) filter.urgency = { $gte: Number(query.urgency) };
  if (query.search) {
    const regex = new RegExp(query.search, "i");
    filter.$or = [{ title: regex }, { description: regex }, { location: regex }, { needId: regex }];
  }
  return filter;
}

export async function getNeeds(req, res, next) {
  try {
    const { sort = "urgency", order = "desc", limit = 0 } = req.query;
    const sortMap = {
      urgency: { urgency: -1, createdAt: -1 },
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      zone: { zone: 1, urgency: -1 }
    };
    const selectedSort = sortMap[sort] || sortMap.urgency;
    if (order === "asc" && selectedSort.createdAt) selectedSort.createdAt = 1;

    const needs = await Need.find(buildNeedQuery(req.query))
      .populate("assignedVolunteerId", "volunteerId name role zone availability")
      .sort(selectedSort)
      .limit(Number(limit) || 0);

    return res.json(needs);
  } catch (error) {
    return next(error);
  }
}

export async function getNeedById(req, res, next) {
  try {
    const need = await Need.findOne({ needId: req.params.id }).populate(
      "assignedVolunteerId",
      "volunteerId name role zone availability rating phone email"
    );
    if (!need) {
      return res.status(404).json({ error: "Need not found" });
    }
    return res.json(need);
  } catch (error) {
    return next(error);
  }
}

export async function createNeed(req, res, next) {
  try {
    const payload = req.body || {};
    if (!payload.title || !payload.location) {
      return res.status(400).json({ error: "title and location are required" });
    }

    const need = await Need.create({
      needId: await generateNextId(Need, "needId", "N"),
      title: payload.title,
      description: payload.description || payload.title,
      category: payload.category,
      urgency: Number(payload.urgency),
      location: payload.location,
      zone: payload.zone,
      peopleAffected: Number(payload.peopleAffected || 0),
      contactName: payload.contactName,
      contactPhone: payload.contactPhone,
      status: payload.status || "Open"
    });

    await logActivity({
      action: "Need Created",
      details: `${need.needId} created in ${need.zone}`,
      entityType: "Need",
      entityId: need.needId,
      performedBy: req.user?.name || "District Command"
    });

    emitEvent("need:created", need);
    return res.status(201).json(need);
  } catch (error) {
    return next(error);
  }
}

export async function updateNeed(req, res, next) {
  try {
    const need = await Need.findOneAndUpdate({ needId: req.params.id }, req.body || {}, {
      new: true,
      runValidators: true
    }).populate("assignedVolunteerId", "volunteerId name role zone availability");

    if (!need) {
      return res.status(404).json({ error: "Need not found" });
    }

    await logActivity({
      action: "Need Updated",
      details: `${need.needId} updated` ,
      entityType: "Need",
      entityId: need.needId,
      performedBy: req.user?.name || "District Command"
    });

    emitEvent("need:updated", need);
    return res.json(need);
  } catch (error) {
    return next(error);
  }
}

export async function deleteNeed(req, res, next) {
  try {
    const need = await Need.findOneAndDelete({ needId: req.params.id });
    if (!need) {
      return res.status(404).json({ error: "Need not found" });
    }

    await logActivity({
      action: "Need Deleted",
      details: `${need.needId} removed`,
      entityType: "Need",
      entityId: need.needId,
      performedBy: req.user?.name || "District Command"
    });

    emitEvent("need:updated", { needId: need.needId, deleted: true });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}

export async function resolveNeed(req, res, next) {
  try {
    const need = await Need.findOneAndUpdate(
      { needId: req.params.id },
      { status: "Resolved", resolvedAt: new Date() },
      { new: true }
    );
    if (!need) {
      return res.status(404).json({ error: "Need not found" });
    }

    await logActivity({
      action: "Need Resolved",
      details: `${need.needId} resolved`,
      entityType: "Need",
      entityId: need.needId,
      performedBy: req.user?.name || "District Command"
    });

    emitEvent("need:updated", need);
    return res.json(need);
  } catch (error) {
    return next(error);
  }
}

export async function assignNeed(req, res, next) {
  try {
    const { volunteerId } = req.body || {};
    const need = await Need.findOne({ needId: req.params.id });
    if (!need) {
      return res.status(404).json({ error: "Need not found" });
    }

    const volunteer = await Volunteer.findOne({ volunteerId });
    if (!volunteer) {
      return res.status(404).json({ error: "Volunteer not found" });
    }

    need.assignedVolunteerId = volunteer._id;
    need.status = "Assigned";
    need.assignedTeam = `${volunteer.role} Team`;
    await need.save();

    volunteer.assignedNeedId = need._id;
    volunteer.availability = "On Route";
    await volunteer.save();

    await logActivity({
      action: "Need Assigned",
      details: `${need.needId} assigned to ${volunteer.volunteerId}`,
      entityType: "Need",
      entityId: need.needId,
      performedBy: req.user?.name || "District Command"
    });

    emitEvent("need:updated", need);
    emitEvent("volunteer:updated", volunteer);
    return res.json(need);
  } catch (error) {
    return next(error);
  }
}