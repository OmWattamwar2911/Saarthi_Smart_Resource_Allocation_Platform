import crypto from "crypto";
import { getDbStatus, isDbConnected } from "../src/config/db.js";

let geminiProbeCache = {
  checkedAt: 0,
  result: { status: "unknown", ok: false, detail: "not_checked" }
};

function getRequestId(req) {
  const existing = req.headers["x-request-id"];
  if (existing && typeof existing === "string") return existing;
  return crypto.randomUUID();
}

function getUserId(req) {
  return req?.user?.id || req?.user?._id || req?.user?.email || null;
}

export function monitoringMiddleware(req, res, next) {
  const startedAt = process.hrtime.bigint();
  const requestId = getRequestId(req);

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const endedAt = process.hrtime.bigint();
    const responseTimeMs = Number(endedAt - startedAt) / 1_000_000;

    const payload = {
      severity: res.statusCode >= 500 ? "ERROR" : "INFO",
      message: "http_request",
      timestamp: new Date().toISOString(),
      request: {
        id: requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        responseTimeMs: Number(responseTimeMs.toFixed(2)),
        userId: getUserId(req),
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || null,
        userAgent: req.headers["user-agent"] || null
      }
    };

    // Structured JSON logs are parsed natively by Cloud Logging.
    console.log(JSON.stringify(payload));
  });

  next();
}

async function checkGeminiConnection() {
  const now = Date.now();
  const cacheTtlMs = 60_000;

  if (now - geminiProbeCache.checkedAt < cacheTtlMs) {
    return geminiProbeCache.result;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const result = { status: "not_configured", ok: false, detail: "GEMINI_API_KEY is missing" };
    geminiProbeCache = { checkedAt: now, result };
    return result;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(endpoint, { method: "GET", signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      const result = {
        status: "unhealthy",
        ok: false,
        detail: `Gemini API returned status ${response.status}`
      };
      geminiProbeCache = { checkedAt: now, result };
      return result;
    }

    const result = { status: "healthy", ok: true, detail: "Gemini API reachable" };
    geminiProbeCache = { checkedAt: now, result };
    return result;
  } catch (error) {
    const result = {
      status: "unhealthy",
      ok: false,
      detail: error?.message || "Gemini API probe failed"
    };
    geminiProbeCache = { checkedAt: now, result };
    return result;
  }
}

export async function healthHandler(req, res) {
  const dbStatus = getDbStatus();
  const dbConnected = isDbConnected();
  const gemini = await checkGeminiConnection();

  const statusCode = dbConnected && (gemini.ok || gemini.status === "not_configured") ? 200 : 503;

  const healthPayload = {
    ok: statusCode === 200,
    service: "saarthi-backend",
    timestamp: new Date().toISOString(),
    uptimeSec: Math.floor(process.uptime()),
    requestId: req.requestId || null,
    checks: {
      db: {
        status: dbStatus,
        connected: dbConnected
      },
      gemini
    }
  };

  // Custom metric-friendly log entries for Monitoring alert filters.
  console.log(
    JSON.stringify({
      message: "health_check",
      saarthi_health_db_connected: dbConnected ? 1 : 0,
      saarthi_health_gemini_connected: gemini.ok ? 1 : 0,
      requestId: req.requestId || null,
      timestamp: new Date().toISOString()
    })
  );

  res.status(statusCode).json(healthPayload);
}
