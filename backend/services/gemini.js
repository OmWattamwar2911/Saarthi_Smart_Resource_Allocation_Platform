import { VertexAI } from "@google-cloud/vertexai";

const project = process.env.GOOGLE_CLOUD_PROJECT || "smart-resource-alloc";
const location = process.env.VERTEX_AI_LOCATION || "us-central1";
const modelName = process.env.GEMINI_MODEL || "gemini-1.5-pro";

const vertex = new VertexAI({ project, location });

function extractTextResponse(response) {
  const parts =
    response?.response?.candidates?.[0]?.content?.parts ||
    response?.candidates?.[0]?.content?.parts ||
    [];

  return parts
    .map((part) => part?.text || "")
    .join("\n")
    .trim();
}

function parseJsonArray(rawText) {
  const cleaned = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new Error("Gemini response is not a JSON array");
  }
  return parsed;
}

export async function generateAssignmentsWithGemini(needs, volunteers) {
  const model = vertex.getGenerativeModel({ model: modelName });

  const needsJson = JSON.stringify(needs, null, 2);
  const volunteersJson = JSON.stringify(volunteers, null, 2);

  const prompt = `You are an AI coordinator for a disaster relief NGO in Rajasthan, India.

Match each community need to the best available volunteer team based on:
1. Skill alignment (medical need → medical team, shelter → logistics team, etc.)
2. Location proximity (prefer same or nearby locationName)
3. Urgency score (higher urgency = higher priority)

For ETA: estimate travel time in minutes based on whether teams are in same
location (8-12 min), nearby (15-20 min), or far (25-35 min).

NEEDS:
${needsJson}

AVAILABLE VOLUNTEER TEAMS:
${volunteersJson}

Return a JSON array ONLY (no markdown, no explanation):
[
  {
    "needId": "...",
    "volunteerId": "...",
    "needDescription": "...",
    "teamName": "...",
    "eta": "18 min",
    "confidenceScore": 95,
    "reasoning": "Doctor Team matched because..."
  }
]`;

  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  });

  const text = extractTextResponse(response);
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return parseJsonArray(text);
}
