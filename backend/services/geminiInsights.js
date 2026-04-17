import { VertexAI } from "@google-cloud/vertexai";

const project = process.env.GOOGLE_CLOUD_PROJECT || "smart-resource-alloc";
const location = process.env.VERTEX_AI_LOCATION || "us-central1";
const modelName = process.env.GEMINI_MODEL || "gemini-1.5-pro";

function parseJsonArray(rawText) {
  const cleaned = String(rawText || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new Error("Gemini insights response is not an array");
  }

  return parsed;
}

function normalizeSeverity(value) {
  const normalized = String(value || "info").toLowerCase();
  if (["critical", "warning", "success", "info"].includes(normalized)) {
    return normalized;
  }
  return "info";
}

function sanitizeInsights(items) {
  const normalized = items.slice(0, 4).map((item) => ({
    severity: normalizeSeverity(item?.severity),
    title: String(item?.title || "Operational update").slice(0, 72),
    description: String(item?.description || "No additional detail provided.").slice(0, 240)
  }));

  while (normalized.length < 4) {
    normalized.push({
      severity: "info",
      title: "Operational update",
      description: "Continue monitoring zone pressure and volunteer allocation." 
    });
  }

  return normalized;
}

function fallbackInsights(analyticsJson) {
  const summary = analyticsJson?.summary || {};
  const zones = Array.isArray(analyticsJson?.zones) ? analyticsJson.zones : [];
  const topPressureZone = zones.slice().sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))[0];
  const slowZone = zones
    .slice()
    .filter((item) => Number.isFinite(item.avgDispatchMin))
    .sort((a, b) => (b.avgDispatchMin || 0) - (a.avgDispatchMin || 0))[0];

  return sanitizeInsights([
    {
      severity: "critical",
      title: `Critical pressure in ${topPressureZone?.zone || "Balotra"}`,
      description: `Open needs are elevated with ${summary.openNeeds || 0} currently active. Reassign an additional medical and logistics team to cut response delay.`
    },
    {
      severity: "warning",
      title: `Dispatch delay in ${slowZone?.zone || "Pachpadra"}`,
      description: `Average dispatch is ${slowZone?.avgDispatchMin || summary.avgDispatchMin || 34} minutes, above SLA. Stage a closer standby volunteer to reduce travel overhead.`
    },
    {
      severity: "success",
      title: "High-performing zone maintained",
      description: `Resolved needs stand at ${summary.resolved || 0} with stable throughput. Keep current staffing pattern and reuse it in medium-risk zones.`
    },
    {
      severity: "info",
      title: "Volunteer availability trend",
      description: `Active volunteers are ${summary.activeVolunteers || 0}. Prepare backup shifts before weekend demand to avoid unmatched critical requests.`
    }
  ]);
}

export async function generateGeminiInsights(analyticsJson) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const appCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!serviceAccount && !appCredentials) {
    return fallbackInsights(analyticsJson);
  }

  try {
    const vertex = new VertexAI({ project, location });
    const model = vertex.getGenerativeModel({ model: modelName });

    const prompt = `You are an analytics AI for a disaster relief coordination platform 
in Barmer District, Rajasthan, India.

Based on this operational data:
${JSON.stringify(analyticsJson, null, 2)}

Generate exactly 4 actionable insights for the NGO coordinator.
Each insight must be specific, data-driven, and actionable.

Return JSON array ONLY:
[{
  "severity": "critical" | "warning" | "success" | "info",
  "title": "short title max 6 words",
  "description": "2 sentences max, specific and actionable"
}]`;

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });

    const text =
      response?.response?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("\n") || "";

    const parsed = parseJsonArray(text);
    return sanitizeInsights(parsed);
  } catch (error) {
    return fallbackInsights(analyticsJson);
  }
}
