const counters = new Map();

export async function generateNextId(Model, field, prefix, pad = 3) {
  const current = counters.get(prefix) ?? 0;

  if (current > 0) {
    const next = current + 1;
    counters.set(prefix, next);
    return `${prefix}-${String(next).padStart(pad, "0")}`;
  }

  const latest = await Model.findOne({ [field]: { $regex: `^${prefix}-` } })
    .sort({ createdAt: -1 })
    .lean();

  if (!latest?.[field]) {
    counters.set(prefix, 1);
    return `${prefix}-${String(1).padStart(pad, "0")}`;
  }

  const parts = String(latest[field]).split("-");
  const base = Number(parts[1]) || 0;
  const next = base + 1;
  counters.set(prefix, next);
  return `${prefix}-${String(next).padStart(pad, "0")}`;
}
