import Report from "../models/Report.js";
import { generateFromPrompt } from "../services/aiService.js";
import { generateNextId } from "../utils/generateId.js";
import { logActivity } from "../services/notificationService.js";

const ICONS = {
	Deployment: "📋",
	Utilization: "👥",
	Supply: "📦",
	Impact: "📊",
	Donor: "💰"
};

export async function getReports(req, res, next) {
	try {
		const reports = await Report.find().sort({ generatedAt: -1 });
		return res.json(reports);
	} catch (error) {
		return next(error);
	}
}

export async function generateReport(req, res, next) {
	try {
		const { type = "Impact", owner = "District Command", metrics = {} } = req.body || {};
		const prompt = `Generate a concise ${type} report summary for Saarthi operations with this data: ${JSON.stringify(metrics)}.`;
		const summary = await generateFromPrompt(prompt, "You write concise operations report summaries.");

		const report = await Report.create({
			reportId: await generateNextId(Report, "reportId", "REP"),
			title: `${type} report summary`,
			owner,
			type,
			content: {
				icon: ICONS[type] || "📄",
				summary,
				metrics
			},
			generatedAt: new Date(),
			lastUpdated: new Date()
		});

		await logActivity({
			action: "Report Generated",
			details: `${report.reportId} (${type}) generated`,
			entityType: "Report",
			entityId: report.reportId,
			performedBy: req.user?.name || "District Command"
		});

		return res.status(201).json(report);
	} catch (error) {
		return next(error);
	}
}

export async function openReportPdf(req, res, next) {
	try {
		const report = await Report.findOne({ reportId: req.params.id });
		if (!report) {
			return res.status(404).json({ error: "Report not found" });
		}

		return res.json({
			reportId: report.reportId,
			title: report.title,
			owner: report.owner,
			type: report.type,
			generatedAt: report.generatedAt,
			content: report.content
		});
	} catch (error) {
		return next(error);
	}
}
