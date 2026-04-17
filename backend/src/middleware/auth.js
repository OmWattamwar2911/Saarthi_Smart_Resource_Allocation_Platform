import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "saarthi_secret_2024");
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
