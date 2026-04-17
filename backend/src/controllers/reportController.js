import Report from "../models/Report.js";
import PDFDocument from "pdfkit";
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

		if (String(req.query.format || "").toLowerCase() !== "pdf") {
			return res.json({
				reportId: report.reportId,
				title: report.title,
				owner: report.owner,
				type: report.type,
				generatedAt: report.generatedAt,
				content: report.content
			});
		}

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `inline; filename="${report.reportId}.pdf"`);

		const doc = new PDFDocument({ size: "A4", margin: 48 });
		doc.pipe(res);

		doc.fontSize(20).text("Saarthi District Operations Report", { align: "left" });
		doc.moveDown(0.6);
		doc.fontSize(12).text(`Report ID: ${report.reportId}`);
		doc.text(`Title: ${report.title}`);
		doc.text(`Owner: ${report.owner}`);
		doc.text(`Type: ${report.type}`);
		doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
		doc.moveDown(1.2);

		doc.fontSize(14).text("Summary", { underline: true });
		doc.moveDown(0.4);
		doc.fontSize(11).text(String(report.content?.summary || "No summary available."), {
			lineGap: 4,
			align: "left"
		});

		doc.moveDown(1);
		doc.fontSize(14).text("Metrics", { underline: true });
		doc.moveDown(0.35);

		const metrics = report.content?.metrics || {};
		const metricEntries = Object.entries(metrics);
		if (!metricEntries.length) {
			doc.fontSize(11).text("No metrics provided.");
		} else {
			for (const [key, value] of metricEntries) {
				doc
					.fontSize(11)
					.text(`${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`);
			}
		}

		doc.end();
		return;

	} catch (error) {
		return next(error);
	}
}
