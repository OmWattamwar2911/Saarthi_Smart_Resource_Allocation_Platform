import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";
import needRoutes from "./routes/needRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();
connectDB();

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/needs", needRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/reports", reportRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "saarthi-backend", time: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.send("Saarthi backend is running");
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});