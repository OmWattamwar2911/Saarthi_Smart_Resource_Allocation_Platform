import "express-async-errors";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import matchesRouter from "./routes/matches.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 8080;

const configuredOrigins = [
  process.env.FIREBASE_HOSTING_ORIGIN,
  process.env.CORS_ORIGIN,
  process.env.CORS_ORIGINS
]
  .filter(Boolean)
  .flatMap((value) => String(value).split(","))
  .map((value) => value.trim())
  .filter(Boolean);

const fallbackOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000"
];

const allowedOrigins = new Set([...fallbackOrigins, ...configuredOrigins]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/matches", matchesRouter);
app.use("/api/v1/matches", matchesRouter);

app.use((error, req, res, next) => {
  const statusCode = Number(error?.statusCode || error?.status || 500);
  const payload = {
    error: error?.message || "Internal server error"
  };

  if (process.env.NODE_ENV !== "production" && error?.stack) {
    payload.details = error.stack;
  }

  res.status(statusCode).json(payload);
});

app.listen(port, () => {
  console.log(`Saarthi backend listening on port ${port}`);
});
