import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cron from "node-cron";

import { closeDB, connectDB, getDbStatus } from "./config/db.js";
import { initSocket } from "./config/socket.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { setIo, emitEvent, logActivity } from "./services/notificationService.js";
import { seedData } from "./utils/seedData.js";
import Need from "./models/Need.js";
import Alert from "./models/Alert.js";
import { generateNextId } from "./utils/generateId.js";

import needRoutes from "./routes/needRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;
const configuredOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const fallbackOrigins = ["http://localhost:5173", "http://localhost:5174"];
const allowedOrigins = new Set([...fallbackOrigins, ...configuredOrigins]);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  return allowedOrigins.has(origin);
}

const dbConnected = await connectDB();

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use("/api/v1/needs", needRoutes);
app.use("/api/v1/volunteers", volunteerRoutes);
app.use("/api/v1/alerts", alertRoutes);
app.use("/api/v1/matches", matchRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/activity", activityRoutes);
app.use("/api/v1/ai", aiRoutes);

app.get("/api/v1/health", (req, res) => {
  res.json({
    ok: true,
    service: "saarthi-backend",
    db: getDbStatus(),
    uptimeSec: Math.floor(process.uptime()),
    time: new Date().toISOString()
  });
});

app.use(errorHandler);

const server = app.listen(port, async () => {
  console.log(`Server running on ${port}`);

  if (!dbConnected) {
    console.log("Skipping seed and database cron jobs because MongoDB is not connected.");
    return;
  }

  const seedResult = await seedData();
  if (seedResult.seeded) {
    console.log("Seed data inserted.");
  }
});

const io = initSocket(server);
setIo(io);

if (dbConnected) {
  cron.schedule("*/1 * * * *", async () => {
    try {
      const urgentOpenNeeds = await Need.aggregate([
        {
          $match: {
            status: "Open",
            urgency: { $gte: 4 }
          }
        },
        { $group: { _id: "$zone", count: { $sum: 1 } } },
        { $match: { count: { $gt: 3 } } }
      ]);

      for (const zoneEntry of urgentOpenNeeds) {
        const zone = zoneEntry._id;
        const count = zoneEntry.count;
        const existing = await Alert.findOne({
          zone,
          status: "Active",
          severity: "High",
          message: { $regex: `Zone ${zone} has`, $options: "i" }
        });

        if (existing) continue;

        const alert = await Alert.create({
          alertId: await generateNextId(Alert, "alertId", "AL"),
          message: `Zone ${zone} has ${count} critical open needs`,
          severity: "High",
          zone,
          status: "Active"
        });

        await logActivity({
          action: "Auto Zone Pressure Alert",
          details: `${alert.alertId} created for ${zone}`,
          entityType: "Alert",
          entityId: alert.alertId,
          performedBy: "System"
        });

        emitEvent("alert:new", {
          alert,
          notification: {
            id: `${Date.now()}-zone-pressure`,
            type: "error",
            message: `Zone pressure alert: ${zone}`,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error("Zone pressure cron failed", error.message);
    }
  });
}

const shutdown = (signal) => {
  console.log(`Received ${signal}. Closing server...`);
  server.close(async () => {
    await closeDB();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
