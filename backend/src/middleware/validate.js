export function validate(schema) {
  return (req, res, next) => {
    const errors = [];
    for (const rule of schema) {
      const value = req.body?.[rule.field];

      if (rule.required && (value === undefined || value === null || value === "")) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      if (value !== undefined && rule.type && typeof value !== rule.type) {
        errors.push(`${rule.field} must be a ${rule.type}`);
      }

      if (typeof value === "string" && rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${rule.field} max length is ${rule.maxLength}`);
      }

      if (typeof value === "number") {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${rule.field} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${rule.field} must be at most ${rule.max}`);
        }
      }
    }

    if (errors.length) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    return next();
  };
}
