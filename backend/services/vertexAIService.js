import { VertexAI } from "@google-cloud/vertexai";

const DEFAULT_MODEL = "gemini-2.0-flash";
const DEFAULT_LOCATION = "us-central1";

function extractText(response) {
  const parts =
    response?.response?.candidates?.[0]?.content?.parts ||
    response?.candidates?.[0]?.content?.parts ||
    [];

  return parts
    .map((part) => part?.text || "")
    .join("\n")
    .trim();
}

function stripJsonCodeFence(text) {
  return String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function getVertexConfig() {
  return {
    project: process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "",
    location: process.env.GCP_LOCATION || process.env.VERTEX_AI_LOCATION || DEFAULT_LOCATION,
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL
  };
}

function buildSystemInstruction(systemPrompt) {
  if (!systemPrompt) return undefined;
  return {
    parts: [{ text: String(systemPrompt) }]
  };
}

export async function generateContentWithVertex({ contents, systemPrompt = "", generationConfig = {} }) {
  const { project, location, model } = getVertexConfig();
  if (!project) {
    throw new Error("Vertex AI project is not configured (set GCP_PROJECT_ID)");
  }

  const vertex = new VertexAI({ project, location });
  const generativeModel = vertex.getGenerativeModel({
    model,
    systemInstruction: buildSystemInstruction(systemPrompt)
  });

  const response = await generativeModel.generateContent({
    contents,
    generationConfig
  });

  return extractText(response);
}

export async function generateContentWithDirectGemini({ contents, systemPrompt = "", generationConfig = {} }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key") {
    throw new Error("Direct Gemini fallback unavailable (GEMINI_API_KEY missing)");
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: buildSystemInstruction(systemPrompt),
        generationConfig
      })
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Direct Gemini failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  return extractText(data);
}

export async function generateContentWithFallback({ contents, systemPrompt = "", generationConfig = {} }) {
  try {
    return await generateContentWithVertex({ contents, systemPrompt, generationConfig });
  } catch (vertexError) {
    console.warn("Vertex AI call failed, attempting direct Gemini fallback.", vertexError?.message || vertexError);
    return generateContentWithDirectGemini({ contents, systemPrompt, generationConfig });
  }
}

export async function generateTextWithFallback({ prompt, systemPrompt = "", temperature = 0.3, maxOutputTokens = 900 }) {
  return generateContentWithFallback({
    systemPrompt,
    contents: [{ role: "user", parts: [{ text: String(prompt || "") }] }],
    generationConfig: {
      temperature,
      maxOutputTokens
    }
  });
}

export async function generateJsonWithFallback({ prompt, systemPrompt = "", temperature = 0.2, maxOutputTokens = 1200 }) {
  const text = await generateContentWithFallback({
    systemPrompt,
    contents: [{ role: "user", parts: [{ text: String(prompt || "") }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(stripJsonCodeFence(text));
}

export async function generateNeedVolunteerAssignments(needs, volunteers) {
  const prompt = `You are an AI coordinator for a disaster relief NGO in Rajasthan, India.

Match each community need to the best available volunteer team based on:
1. Skill alignment (medical need -> medical team, shelter -> logistics team, etc.)
2. Location proximity (prefer same or nearby zone)
3. Urgency score (higher urgency = higher priority)

For ETA: estimate travel time in minutes based on whether teams are in same
zone (8-12 min), nearby (15-20 min), or far (25-35 min).

NEEDS:
${JSON.stringify(needs, null, 2)}

AVAILABLE VOLUNTEER TEAMS:
${JSON.stringify(volunteers, null, 2)}

Return a JSON array ONLY:
[
  {
    "needId": "...",
    "volunteerId": "...",
    "needDescription": "...",
    "teamName": "...",
    "eta": "18 min",
    "confidenceScore": 95,
    "reasoning": "Doctor team matched because..."
  }
]`;

  const response = await generateJsonWithFallback({
    prompt,
    systemPrompt: "Return valid JSON only. Do not use markdown fences.",
    temperature: 0.2,
    maxOutputTokens: 1600
  });

  if (!Array.isArray(response)) {
    throw new Error("AI matching response is not an array");
  }

  return response;
}

export async function assessDamageFromImage({ imageBuffer, mimeType }) {
  const base64Image = Buffer.from(imageBuffer).toString("base64");

  const prompt = `Analyze this disaster image and return JSON ONLY in this format:
{
  "urgency": 1-5,
  "category": "food|shelter|medical|rescue",
  "zoneSuggestion": "short zone suggestion",
  "description": "concise operational description"
}

Rules:
- urgency must be integer between 1 and 5.
- category must be one of: food, shelter, medical, rescue.
- Keep description under 280 characters.`;

  const response = await generateContentWithFallback({
    systemPrompt:
      "You are a disaster damage triage analyst for emergency operations. Return strict JSON only.",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: base64Image
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 600,
      responseMimeType: "application/json"
    }
  });

  const parsed = JSON.parse(stripJsonCodeFence(response));
  return {
    urgency: Math.min(5, Math.max(1, Number(parsed?.urgency || 3))),
    category: ["food", "shelter", "medical", "rescue"].includes(String(parsed?.category || "").toLowerCase())
      ? String(parsed.category).toLowerCase()
      : "rescue",
    zoneSuggestion: String(parsed?.zoneSuggestion || "Barmer Central").slice(0, 80),
    description: String(parsed?.description || "Potentially impacted area detected. Immediate field verification recommended.").slice(0, 280)
  };
}
