import { generateFromPrompt, heuristicMatch } from "../services/aiService.js";

export const runMatching = async (req, res, next) => {
  try {
    const { needs = [], volunteers = [] } = req.body || {};
    const result = heuristicMatch(needs, volunteers);
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