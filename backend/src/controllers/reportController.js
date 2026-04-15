import { generateFromPrompt } from "../services/aiService.js";

export const generateImpactReport = async (req, res, next) => {
	try {
		const metrics = req.body?.metrics || {
			interventions: 184,
			peopleHelped: 1240,
			responseTimeNow: "38 min",
			responseTimeBefore: "3.2 hr",
			aiAccuracy: "94.2%"
		};

		const prompt = `Generate a 5 sentence donor-ready impact summary using these metrics: ${JSON.stringify(
			metrics
		)}. Focus on measurable outcomes and operational reliability.`;

		const text = await generateFromPrompt(
			prompt,
			"You write concise and data-driven NGO impact summaries."
		);

		res.json({ report: text, generatedAt: new Date().toISOString() });
	} catch (error) {
		next(error);
	}
};
