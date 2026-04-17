const counters = new Map();

function extractNumericSuffix(value, prefix) {
  const raw = String(value || "");
  if (!raw.startsWith(`${prefix}-`)) {
    return 0;
  }

  const suffix = raw.slice(prefix.length + 1);
  const parsed = Number.parseInt(suffix, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function generateNextId(Model, field, prefix, pad = 3) {
  const current = counters.get(prefix) ?? 0;

  const existing = await Model.find({ [field]: { $regex: `^${prefix}-` } }, { [field]: 1, _id: 0 }).lean();
  const maxFromDb = existing.reduce((max, row) => {
    const value = extractNumericSuffix(row?.[field], prefix);
    return Math.max(max, value);
  }, 0);

  const base = Math.max(current, maxFromDb);
  const next = base + 1;
  counters.set(prefix, next);
  return `${prefix}-${String(next).padStart(pad, "0")}`;
}
