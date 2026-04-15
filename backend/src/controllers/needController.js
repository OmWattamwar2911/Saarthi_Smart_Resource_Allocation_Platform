import { needsStore, nextId } from "../utils/store.js";

export const getNeeds = async (req, res) => {
  const { status, category } = req.query;
  let filtered = [...needsStore].sort((a, b) => Number(b.id) - Number(a.id));

  if (status) {
    filtered = filtered.filter((need) => need.status === status);
  }
  if (category) {
    filtered = filtered.filter((need) => need.category === category);
  }

  res.json(filtered);
};

export const createNeed = async (req, res) => {
  const { desc, title, location, category = "General", urgency = 3, people = 0 } = req.body || {};
  const normalizedDesc = (desc || title || "").trim();

  if (!normalizedDesc || !location) {
    return res.status(400).json({ error: "desc/title and location are required" });
  }

  const now = new Date().toISOString();
  const created = {
    id: nextId(needsStore),
    desc: normalizedDesc,
    title: normalizedDesc,
    location,
    category,
    urgency: Number(urgency),
    people: Number(people) || 0,
    status: "open",
    time: "just now",
    createdAt: now,
    updatedAt: now
  };

  needsStore.unshift(created);
  res.status(201).json(created);
};

export const resolveNeed = async (req, res) => {
  const id = Number(req.params.id);
  const index = needsStore.findIndex((need) => Number(need.id) === id);

  if (index < 0) {
    return res.status(404).json({ error: "Need not found" });
  }

  needsStore[index] = {
    ...needsStore[index],
    status: "resolved",
    updatedAt: new Date().toISOString()
  };

  res.json(needsStore[index]);
};