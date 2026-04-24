import { generateFromPrompt, heuristicMatch } from "../services/aiService.js";
import {
  assessDamageFromImage,
  generateJsonWithFallback,
  generateNeedVolunteerAssignments,
  generateTextWithFallback
} from "../services/vertexAIService.js";
import Need from "../models/Need.js";
import Volunteer from "../models/Volunteer.js";
import Alert from "../models/Alert.js";
import Match from "../models/Match.js";

const COLLECTION_MODELS = {
  needs: Need,
  volunteers: Volunteer,
  alerts: Alert,
  matches: Match
};

const ALLOWED_STAGES = new Set(["$match", "$group", "$sort", "$limit", "$project", "$count"]);

function sanitizePipeline(rawPipeline = []) {
  if (!Array.isArray(rawPipeline)) return [];

  return rawPipeline
    .filter((stage) => stage && typeof stage === "object" && !Array.isArray(stage))
    .filter((stage) => Object.keys(stage).length === 1 && ALLOWED_STAGES.has(Object.keys(stage)[0]))
    .slice(0, 6);
}

function summarizeRows(rows) {
  if (Array.isArray(rows)) {
    return rows.slice(0, 25);
  }
  if (rows && typeof rows === "object") {
    return rows;
  }
  return [];
}

export const runMatching = async (req, res, next) => {
  try {
    const { needs = [], volunteers = [] } = req.body || {};
    let matches = [];

    try {
      matches = await generateNeedVolunteerAssignments(needs, volunteers);
    } catch {
      const fallback = heuristicMatch(needs, volunteers);
      return res.json(fallback);
    }

    const result = {
      matches,
      summary: `${matches.length} matches generated.`
    };

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const generateAIText = async (req, res, next) => {
  try {
    const { prompt = "", systemPrompt = "" } = req.body || {};
    if (!prompt.trim()) {
      return res.status(400).json({ error: "prompt is required" });
    }

    const text = await generateFromPrompt(prompt, systemPrompt);
    res.json({ text });
  } catch (error) {
    next(error);
  }
};

export const assessDamage = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "image file is required" });
    }

    let data;
    try {
      data = await assessDamageFromImage({
        imageBuffer: req.file.buffer,
        mimeType: req.file.mimetype
      });
    } catch {
      data = {
        urgency: 3,
        category: "rescue",
        zoneSuggestion: "Barmer Central",
        description: "Image received. Potential structural and access disruption observed; dispatch verification team."
      };
    }

    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

export const queryAnalytics = async (req, res, next) => {
  try {
    const question = String(req.body?.question || "").trim();
    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }

    // Prompt logic: ask the model for a safe MongoDB query plan with strict collection and stage limits.
    const planPrompt = `Translate the user analytics question into a JSON query plan.

Question: ${question}

Allowed collections: needs, volunteers, alerts, matches
Allowed actions: aggregate, count, find
Allowed aggregate stages: $match, $group, $sort, $limit, $project, $count

Return JSON only:
{
  "collection": "needs|volunteers|alerts|matches",
  "action": "aggregate|count|find",
  "pipeline": [],
  "filter": {},
  "projection": {},
  "limit": 20
}`;

    const plan = await generateJsonWithFallback({
      prompt: planPrompt,
      systemPrompt: "You are a MongoDB query planner for humanitarian analytics. Return valid JSON only.",
      temperature: 0.1,
      maxOutputTokens: 900
    });

    const collectionName = String(plan?.collection || "needs").toLowerCase();
    const action = String(plan?.action || "aggregate").toLowerCase();
    const Model = COLLECTION_MODELS[collectionName] || Need;

    let rawData;
    if (action === "count") {
      rawData = {
        count: await Model.countDocuments(plan?.filter && typeof plan.filter === "object" ? plan.filter : {})
      };
    } else if (action === "find") {
      const filter = plan?.filter && typeof plan.filter === "object" ? plan.filter : {};
      const projection = plan?.projection && typeof plan.projection === "object" ? plan.projection : {};
      const limit = Math.min(50, Math.max(1, Number(plan?.limit || 20)));
      rawData = await Model.find(filter, projection).limit(limit).lean();
    } else {
      const pipeline = sanitizePipeline(plan?.pipeline);
      rawData = await Model.aggregate(pipeline.length ? pipeline : [{ $limit: 20 }]);
    }

    const summarizedData = summarizeRows(rawData);
    let answer;
    try {
      answer = await generateTextWithFallback({
        prompt: `Question: ${question}\n\nData:\n${JSON.stringify(summarizedData, null, 2)}\n\nProvide a concise plain-English answer for NGO operators.`,
        systemPrompt: "You are an analytics assistant for a disaster relief command center.",
        temperature: 0.2,
        maxOutputTokens: 500
      });
    } catch {
      answer = `Retrieved ${Array.isArray(summarizedData) ? summarizedData.length : 1} data record(s) for the question: ${question}`;
    }

    return res.json({
      answer,
      data: summarizedData,
      queryPlan: {
        collection: collectionName,
        action
      }
    });
  } catch (error) {
    return next(error);
  }
};