import Report from "../models/Report.js";
import PDFDocument from "pdfkit";
import { generateFromPrompt } from "../services/aiService.js";
import { generateNextId } from "../utils/generateId.js";
import { logActivity } from "../services/notificationService.js";
import Need from "../models/Need.js";
import Volunteer from "../models/Volunteer.js";
import Match from "../models/Match.js";
import Alert from "../models/Alert.js";
import ActivityLog from "../models/ActivityLog.js";
import Setting from "../models/Setting.js";
import { ZONES } from "../config/constants.js";
import { getCategoryCounts, getSummaryStats, getTimeline, getZoneStats } from "../services/analyticsService.js";

const ICONS = {
	Deployment: "DEP",
	Utilization: "UTIL",
	Supply: "SUP",
	Impact: "IMP",
	Donor: "DON",
	Comprehensive: "COMP"
};

const OPEN_NEED_STATUSES = ["Open", "Assigned", "Queued"];

function formatDateTime(value) {
	if (!value) return "-";
	return new Date(value).toLocaleString();
}

function asText(value) {
	if (value === null || value === undefined) return "-";
	if (typeof value === "number") return Number.isFinite(value) ? `${value}` : "-";
	if (typeof value === "boolean") return value ? "Yes" : "No";
	if (Array.isArray(value)) return value.join(", ");
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}

function roundNumber(value) {
	if (!Number.isFinite(Number(value))) return 0;
	return Math.round(Number(value));
}

function ratioPercent(part, whole) {
	if (!whole) return 0;
	return roundNumber((part / whole) * 100);
}

function startOfDay(date) {
	const day = new Date(date);
	day.setHours(0, 0, 0, 0);
	return day;
}

function buildDailyTimeline(needs) {
	const points = [];
	const today = startOfDay(new Date());

	for (let i = 6; i >= 0; i -= 1) {
		const day = new Date(today);
		day.setDate(day.getDate() - i);
		const nextDay = new Date(day);
		nextDay.setDate(nextDay.getDate() + 1);

		const created = needs.filter((need) => {
			const createdAt = need.createdAt ? new Date(need.createdAt) : null;
			return createdAt && createdAt >= day && createdAt < nextDay;
		}).length;

		const resolved = needs.filter((need) => {
			const resolvedAt = need.resolvedAt ? new Date(need.resolvedAt) : null;
			return resolvedAt && resolvedAt >= day && resolvedAt < nextDay;
		}).length;

		points.push({
			day: day.toLocaleDateString(undefined, { weekday: "short" }),
			date: day.toLocaleDateString(),
			created,
			resolved
		});
	}

	return points;
}

function buildZoneStats(needs) {
	const byZone = new Map();
	for (const zone of ZONES) {
		byZone.set(zone, { zone, open: 0, critical: 0, resolved: 0, avgUrgency: 0, urgencySum: 0, urgencyCount: 0 });
	}

	for (const need of needs) {
		const zoneName = need.zone && byZone.has(need.zone) ? need.zone : "Barmer Central";
		const slot = byZone.get(zoneName);
		const urgency = Number(need.urgency || 0);

		if (OPEN_NEED_STATUSES.includes(need.status)) {
			slot.open += 1;
			if (urgency >= 4) slot.critical += 1;
		}
		if (need.status === "Resolved") {
			slot.resolved += 1;
		}
		if (urgency > 0) {
			slot.urgencySum += urgency;
			slot.urgencyCount += 1;
		}
	}

	return [...byZone.values()].map((zone) => ({
		...zone,
		avgUrgency: zone.urgencyCount ? (zone.urgencySum / zone.urgencyCount).toFixed(1) : "0.0"
	}));
}

function summarizeTopNeeds(needs) {
	return needs
		.filter((need) => OPEN_NEED_STATUSES.includes(need.status))
		.sort((a, b) => Number(b.urgency || 0) - Number(a.urgency || 0))
		.slice(0, 5)
		.map((need) => ({
			id: need.needId,
			title: need.title,
			zone: need.zone,
			urgency: Number(need.urgency || 0),
			status: need.status
		}));
}

function summarizeVolunteerLeads(volunteers) {
	return [...volunteers]
		.filter((volunteer) => volunteer.isActive !== false)
		.sort((a, b) => Number(b.tasksCompleted || 0) - Number(a.tasksCompleted || 0))
		.slice(0, 5)
		.map((volunteer) => ({
			id: volunteer.volunteerId,
			name: volunteer.name,
			role: volunteer.role,
			zone: volunteer.zone,
			tasks: Number(volunteer.tasksCompleted || 0),
			availability: volunteer.availability
		}));
}

function section(title, subtitle, highlights, rows = []) {
	return { title, subtitle, highlights, rows };
}

async function buildDetailedContent(type, owner, inputMetrics = {}) {
	const [needs, volunteers, matches, alerts, activity, settingsDoc, reports] = await Promise.all([
		Need.find().lean(),
		Volunteer.find().lean(),
		Match.find().populate("needId", "needId title zone urgency status").populate("volunteerId", "volunteerId name role zone availability").lean(),
		Alert.find().sort({ createdAt: -1 }).lean(),
		ActivityLog.find().sort({ timestamp: -1 }).limit(25).lean(),
		Setting.findOne({ key: "platform" }).lean(),
		Report.find().sort({ generatedAt: -1 }).limit(10).lean()
	]);

	const openNeeds = needs.filter((need) => OPEN_NEED_STATUSES.includes(need.status));
	const resolvedNeeds = needs.filter((need) => need.status === "Resolved");
	const criticalOpenNeeds = openNeeds.filter((need) => Number(need.urgency || 0) >= 4);
	const peopleAffected = needs.reduce((sum, need) => sum + Number(need.peopleAffected || 0), 0);

	const activeVolunteers = volunteers.filter((volunteer) => ["Available", "On Route", "Assigned"].includes(volunteer.availability));
	const offDutyVolunteers = volunteers.filter((volunteer) => volunteer.availability === "Off Duty");

	const pendingMatches = matches.filter((match) => match.status === "Pending");
	const confirmedMatches = matches.filter((match) => match.status === "Confirmed");
	const rejectedMatches = matches.filter((match) => match.status === "Rejected");
	const avgConfidence = roundNumber(
		matches.reduce((sum, match) => sum + Number(match.confidence || 0), 0) / (matches.length || 1)
	);

	const activeAlerts = alerts.filter((alert) => alert.status === "Active");
	const escalatedAlerts = alerts.filter((alert) => alert.status === "Escalated");
	const resolvedAlerts = alerts.filter((alert) => alert.status === "Resolved");

	const zoneStats = buildZoneStats(needs);
	const timeline = buildDailyTimeline(needs);
	const topNeeds = summarizeTopNeeds(needs);
	const volunteerLeads = summarizeVolunteerLeads(volunteers);

	const notificationsSummary = {
		criticalAlerts: activeAlerts.filter((alert) => alert.severity === "Critical").length,
		pendingMatches: pendingMatches.length,
		criticalOpenNeeds: criticalOpenNeeds.length
	};

	const overviewMetrics = {
		totalNeeds: needs.length,
		openNeeds: openNeeds.length,
		resolvedNeeds: resolvedNeeds.length,
		criticalOpenNeeds: criticalOpenNeeds.length,
		activeVolunteers: activeVolunteers.length,
		totalVolunteers: volunteers.length,
		avgMatchConfidence: avgConfidence,
		activeAlerts: activeAlerts.length,
		escalatedAlerts: escalatedAlerts.length,
		peopleAffected,
		resolutionRate: ratioPercent(resolvedNeeds.length, needs.length || 1),
		activeVolunteerRate: ratioPercent(activeVolunteers.length, volunteers.length || 1)
	};

	const generatedAt = new Date().toISOString();

	const sections = [
		section(
			"Home",
			"District command overview and mission status",
			[
				`Operational snapshot generated at ${formatDateTime(generatedAt)}`,
				`Open needs: ${overviewMetrics.openNeeds}`,
				`Active volunteers: ${overviewMetrics.activeVolunteers}`,
				`Active alerts: ${overviewMetrics.activeAlerts}`,
				`People affected tracked: ${overviewMetrics.peopleAffected}`
			],
			[
				["Metric", "Value"],
				["Resolution Rate", `${overviewMetrics.resolutionRate}%`],
				["Volunteer Active Rate", `${overviewMetrics.activeVolunteerRate}%`],
				["Average Match Confidence", `${overviewMetrics.avgMatchConfidence}%`]
			]
		),
		section(
			"Dashboard",
			"Live operations KPI summary",
			[
				`Total needs in system: ${overviewMetrics.totalNeeds}`,
				`Open pipeline: ${overviewMetrics.openNeeds}`,
				`Resolved cases: ${overviewMetrics.resolvedNeeds}`,
				`Critical backlog: ${overviewMetrics.criticalOpenNeeds}`
			],
			[
				["KPI", "Value"],
				["Open Needs", overviewMetrics.openNeeds],
				["Resolved Needs", overviewMetrics.resolvedNeeds],
				["Critical Open", overviewMetrics.criticalOpenNeeds],
				["Active Alerts", overviewMetrics.activeAlerts]
			]
		),
		section(
			"Needs",
			"Needs queue quality, urgency and priority distribution",
			[
				`Top ${topNeeds.length} needs are included by urgency`,
				`Open vs Resolved: ${openNeeds.length} / ${resolvedNeeds.length}`,
				`Critical open needs (urgency >= 4): ${criticalOpenNeeds.length}`
			],
			[["Need ID", "Title", "Zone", "Urgency", "Status"], ...topNeeds.map((need) => [need.id, need.title, need.zone, need.urgency, need.status])]
		),
		section(
			"AI Matching",
			"Match pipeline confidence and assignment throughput",
			[
				`Total matches: ${matches.length}`,
				`Pending: ${pendingMatches.length}, Confirmed: ${confirmedMatches.length}, Rejected: ${rejectedMatches.length}`,
				`Average confidence: ${avgConfidence}%`
			],
			[
				["State", "Count"],
				["Pending", pendingMatches.length],
				["Confirmed", confirmedMatches.length],
				["Rejected", rejectedMatches.length]
			]
		),
		section(
			"Volunteers",
			"Volunteer utilization, readiness, and top contributors",
			[
				`Active volunteers: ${activeVolunteers.length}/${volunteers.length}`,
				`Off duty volunteers: ${offDutyVolunteers.length}`,
				`Top performers are listed by tasks completed`
			],
			[["Volunteer", "Role", "Zone", "Tasks", "Availability"], ...volunteerLeads.map((volunteer) => [volunteer.name, volunteer.role, volunteer.zone, volunteer.tasks, volunteer.availability])]
		),
		section(
			"Analytics",
			"Zone pressure and 7-day operational trend",
			[
				`Zone analytics generated for ${zoneStats.length} zones`,
				`7-day timeline includes daily created and resolved counts`
			],
			[
				["Zone", "Open", "Critical", "Resolved", "Avg Urgency"],
				...zoneStats.map((zone) => [zone.zone, zone.open, zone.critical, zone.resolved, zone.avgUrgency])
			]
		),
		section(
			"Alerts",
			"Escalation posture and alert lifecycle health",
			[
				`Active alerts: ${activeAlerts.length}`,
				`Escalated alerts: ${escalatedAlerts.length}`,
				`Resolved alerts: ${resolvedAlerts.length}`
			],
			[
				["Alert ID", "Severity", "Zone", "Status", "Created"],
				...alerts.slice(0, 8).map((alert) => [alert.alertId, alert.severity, alert.zone, alert.status, formatDateTime(alert.createdAt)])
			]
		),
		section(
			"Reports",
			"Reporting cadence and governance trace",
			[
				`Existing reports in retention set: ${reports.length}`,
				`Current report owner: ${owner}`,
				`Report type requested: ${type}`
			],
			[
				["Report ID", "Type", "Owner", "Generated"],
				...reports.slice(0, 8).map((report) => [report.reportId, report.type, report.owner, formatDateTime(report.generatedAt)])
			]
		),
		section(
			"Notifications",
			"Eventing and trigger signals",
			[
				`Critical alert notifications pending: ${notificationsSummary.criticalAlerts}`,
				`Pending AI dispatch recommendations: ${notificationsSummary.pendingMatches}`,
				`Critical open needs to notify: ${notificationsSummary.criticalOpenNeeds}`
			],
			[
				["Signal", "Count"],
				["Critical Active Alerts", notificationsSummary.criticalAlerts],
				["Pending Matches", notificationsSummary.pendingMatches],
				["Critical Open Needs", notificationsSummary.criticalOpenNeeds]
			]
		),
		section(
			"Global Search",
			"Cross-module searchable records coverage",
			[
				`Needs indexed: ${needs.length}`,
				`Volunteers indexed: ${volunteers.length}`,
				`Alerts indexed: ${alerts.length}`,
				`Reports indexed: ${reports.length}`
			],
			[
				["Entity", "Indexed Records"],
				["Needs", needs.length],
				["Volunteers", volunteers.length],
				["Alerts", alerts.length],
				["Reports", reports.length]
			]
		),
		section(
			"History",
			"Recent audit trail and operator actions",
			[
				`Recent activity events included: ${activity.length}`,
				`Audit sequence is sorted latest first`
			],
			[
				["Time", "Action", "Entity", "By"],
				...activity.slice(0, 10).map((entry) => [formatDateTime(entry.timestamp), entry.action, `${entry.entityType} ${entry.entityId}`, entry.performedBy])
			]
		),
		section(
			"Settings",
			"Platform configuration and operations mode",
			[
				`Platform mode: ${settingsDoc?.platformMode || "Glass Command-Center"}`,
				`Theme: ${settingsDoc?.theme || "light"}`,
				`Notifications: email=${settingsDoc?.notifications?.email ? "on" : "off"}, sms=${settingsDoc?.notifications?.sms ? "on" : "off"}, inApp=${settingsDoc?.notifications?.inApp ? "on" : "off"}`,
				`Configured zones: ${Array.isArray(settingsDoc?.zones) ? settingsDoc.zones.length : ZONES.length}`
			],
			[["Timeline Day", "Created", "Resolved"], ...timeline.map((item) => [item.day, item.created, item.resolved])]
		)
	];

	const summaryPrompt = [
		`Create an authentic district operations summary for a ${type} report.`,
		`Open needs: ${openNeeds.length}, resolved needs: ${resolvedNeeds.length}, critical open needs: ${criticalOpenNeeds.length}.`,
		`Active volunteers: ${activeVolunteers.length}/${volunteers.length}, average match confidence: ${avgConfidence}%.`,
		`Active alerts: ${activeAlerts.length}, escalated alerts: ${escalatedAlerts.length}.`,
		"Write 2 concise paragraphs with operational insights and immediate recommendations."
	].join(" ");

	let summary;
	try {
		summary = await generateFromPrompt(summaryPrompt, "You are a district operations analyst writing concise, actionable summaries.");
	} catch {
		summary = `Operational posture is stable with ${openNeeds.length} open needs and ${activeVolunteers.length} active volunteers. Critical backlog currently stands at ${criticalOpenNeeds.length} needs, with average AI match confidence of ${avgConfidence}%.\n\nRecommended priority is to clear critical open needs in high-pressure zones first, then reduce pending match queue and escalated alerts through targeted dispatch planning and volunteer rebalancing.`;
	}

	const metrics = {
		...overviewMetrics,
		...inputMetrics
	};

	return {
		icon: ICONS[type] || "REP",
		summary,
		metrics,
		sections,
		generatedAt,
		source: {
			needs: needs.length,
			volunteers: volunteers.length,
			matches: matches.length,
			alerts: alerts.length,
			activity: activity.length,
			settingsLoaded: Boolean(settingsDoc)
		}
	};
}

function ensureSpace(doc, requiredHeight = 80) {
	if (doc.y + requiredHeight > doc.page.height - doc.page.margins.bottom) {
		doc.addPage();
	}
}

function writeKeyValueTable(doc, rows = []) {
	if (!rows.length) {
		doc.fontSize(10).fillColor("#4b5563").text("No rows available.");
		return;
	}

	const [headers, ...dataRows] = rows;
	if (!Array.isArray(headers)) {
		return;
	}

	doc.moveDown(0.2);
	doc.fontSize(10).fillColor("#0f172a").text(headers.join(" | "));
	doc.moveDown(0.15);

	for (const row of dataRows) {
		ensureSpace(doc, 22);
		doc.fontSize(9.5).fillColor("#1f2937").text((row || []).map((cell) => asText(cell)).join(" | "));
	}
}

function drawHeader(doc, report) {
	const x = doc.page.margins.left;
	const y = 20;
	const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
	doc.save();
	doc.rect(x, y, w, 18).fill("#f3f7fb");
	doc.fillColor("#1e3a5f").fontSize(9).text("Saarthi District Operations", x + 8, y + 5, {
		width: w - 16,
		align: "left"
	});
	doc.fontSize(8.5).fillColor("#475569").text(`${report.reportId} | ${report.type}`, x + 8, y + 5, {
		width: w - 16,
		align: "right"
	});
	doc.restore();
}

function drawFooter(doc, pageNumber, totalPages) {
	const y = doc.page.height - 24;
	doc.save();
	doc.moveTo(doc.page.margins.left, y - 6).lineTo(doc.page.width - doc.page.margins.right, y - 6).strokeColor("#d7e1ea").lineWidth(0.7).stroke();
	doc.fillColor("#64748b").fontSize(8.5).text(`Generated ${new Date().toLocaleString()}`, doc.page.margins.left, y, {
		width: 220,
		align: "left"
	});
	doc.text(`Page ${pageNumber} of ${totalPages}`, doc.page.margins.left, y, {
		width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
		align: "right"
	});
	doc.restore();
}

function drawCoverPage(doc, report) {
	const left = doc.page.margins.left;
	const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

	doc.save();
	doc.rect(0, 0, doc.page.width, 120).fill("#0f3b66");
	doc.restore();

	doc.save();
	doc.circle(left + 32, 62, 22).fill("#f8fafc");
	doc.fillColor("#0f3b66").fontSize(12).text("SD", left + 22, 56, { width: 20, align: "center" });
	doc.restore();

	doc.fillColor("#f8fafc").fontSize(11).text("District Disaster Response Cell", left + 66, 46, {
		width: width - 70,
		align: "left"
	});
	doc.fontSize(9.5).text("Saarthi Smart Resource Allocation Platform", left + 66, 62, {
		width: width - 70,
		align: "left"
	});

	doc.y = 160;
	doc.fillColor("#0f172a").fontSize(24).text("Official Operations Report", { align: "left" });
	doc.moveDown(0.25);
	doc.fontSize(16).fillColor("#1d4e89").text(`${report.type} Intelligence Dossier`, { align: "left" });
	doc.moveDown(1.1);

	doc.save();
	doc.roundedRect(left, doc.y, width, 136, 8).fill("#f8fbff").strokeColor("#d7e3ef").lineWidth(1).stroke();
	doc.restore();

	const metaTop = doc.y + 14;
	doc.fillColor("#0f172a").fontSize(11);
	doc.text(`Report ID: ${report.reportId}`, left + 14, metaTop);
	doc.text(`Title: ${report.title}`, left + 14, metaTop + 22);
	doc.text(`Owner: ${report.owner}`, left + 14, metaTop + 44);
	doc.text(`Generated: ${formatDateTime(report.generatedAt)}`, left + 14, metaTop + 66);
	doc.text(`Classification: Internal Administrative Use`, left + 14, metaTop + 88);

	doc.y = metaTop + 118;
	doc.moveDown(1.3);
	doc.fillColor("#334155").fontSize(10).text(
		"This document is generated from live MongoDB-backed operational records and is intended for district command review, audit, and resource planning.",
		{ lineGap: 3 }
	);

	doc.moveDown(2.2);
	doc.fontSize(10).fillColor("#0f172a").text("Prepared By", left, doc.y);
	doc.text("Verified By", left + width / 3, doc.y - 12);
	doc.text("Approved By", left + (2 * width) / 3, doc.y - 12);

	const sigY = doc.y + 18;
	doc.moveTo(left, sigY).lineTo(left + width / 3 - 18, sigY).strokeColor("#94a3b8").lineWidth(0.8).stroke();
	doc.moveTo(left + width / 3, sigY).lineTo(left + (2 * width) / 3 - 18, sigY).stroke();
	doc.moveTo(left + (2 * width) / 3, sigY).lineTo(left + width, sigY).stroke();

	doc.fontSize(8.5).fillColor("#64748b").text("Operations Officer", left, sigY + 6, { width: width / 3 - 18, align: "left" });
	doc.text("Control Room Supervisor", left + width / 3, sigY + 6, { width: width / 3 - 18, align: "left" });
	doc.text("District Magistrate / Authority", left + (2 * width) / 3, sigY + 6, { width: width / 3, align: "left" });
}

function drawApprovalSection(doc) {
	const left = doc.page.margins.left;
	const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

	doc.fontSize(16).fillColor("#0f172a").text("Administrative Approval Section", { underline: true });
	doc.moveDown(0.6);
	doc.fontSize(10).fillColor("#334155").text(
		"Review checklist and sign-off details for administrative closure. Complete all fields before filing this document.",
		{ lineGap: 3 }
	);
	doc.moveDown(0.8);

	doc.save();
	doc.roundedRect(left, doc.y, width, 150, 8).fill("#f8fbff").strokeColor("#d7e3ef").lineWidth(1).stroke();
	doc.restore();

	const top = doc.y + 14;
	doc.fontSize(10).fillColor("#0f172a");
	doc.text("Compliance Review: [ ] Completed", left + 14, top);
	doc.text("Data Validation: [ ] Completed", left + 14, top + 22);
	doc.text("Field Escalation Review: [ ] Completed", left + 14, top + 44);
	doc.text("Finance/Donor Note Required: [ ] Yes  [ ] No", left + 14, top + 66);
	doc.text("Final Remarks:", left + 14, top + 92);

	doc.moveTo(left + 95, top + 106).lineTo(left + width - 16, top + 106).strokeColor("#94a3b8").lineWidth(0.7).stroke();
	doc.moveTo(left + 95, top + 122).lineTo(left + width - 16, top + 122).stroke();

	doc.y = top + 164;
	doc.moveDown(0.8);
	doc.fontSize(10).fillColor("#0f172a").text("Signature (Approving Authority)", left, doc.y);
	doc.moveTo(left, doc.y + 20).lineTo(left + 230, doc.y + 20).strokeColor("#64748b").lineWidth(0.8).stroke();
	doc.fontSize(9).fillColor("#64748b").text("Name, designation, and official seal", left, doc.y + 24);
}

function drawStructuredTable(doc, rows = []) {
	if (!Array.isArray(rows) || rows.length < 2) {
		writeKeyValueTable(doc, rows);
		return;
	}

	const [headers, ...dataRows] = rows;
	const columnCount = Array.isArray(headers) ? headers.length : 0;
	if (!columnCount) {
		writeKeyValueTable(doc, rows);
		return;
	}

	const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
	const colWidth = tableWidth / columnCount;
	let y = doc.y;

	const drawHeaderRow = () => {
		ensureSpace(doc, 26);
		y = doc.y;
		doc.save();
		doc.rect(doc.page.margins.left, y, tableWidth, 22).fill("#e9f0f7");
		doc.restore();

		headers.forEach((header, idx) => {
			const x = doc.page.margins.left + idx * colWidth;
			doc.rect(x, y, colWidth, 22).strokeColor("#c6d3e0").lineWidth(0.6).stroke();
			doc.fillColor("#0f172a").fontSize(9).text(asText(header), x + 5, y + 7, {
				width: colWidth - 10,
				align: "left",
				ellipsis: true
			});
		});

		doc.y = y + 22;
	};

	drawHeaderRow();

	for (const row of dataRows) {
		const cells = Array.isArray(row) ? row : [];
		const rawHeights = cells.map((cell) =>
			doc.heightOfString(asText(cell), {
				width: colWidth - 10,
				align: "left"
			})
		);
		const rowHeight = Math.max(20, Math.ceil(Math.max(...rawHeights, 12) + 8));

		if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom - 24) {
			doc.addPage();
			drawHeaderRow();
		}

		y = doc.y;
		cells.forEach((cell, idx) => {
			const x = doc.page.margins.left + idx * colWidth;
			doc.rect(x, y, colWidth, rowHeight).strokeColor("#dbe4ee").lineWidth(0.5).stroke();
			doc.fillColor("#1f2937").fontSize(9).text(asText(cell), x + 5, y + 4, {
				width: colWidth - 10,
				align: "left"
			});
		});

		doc.y = y + rowHeight;
	}
}

function normalizeQueryValue(value) {
	const text = String(value || "").trim();
	if (!text || text.toLowerCase() === "all") {
		return "";
	}
	return text;
}

function escapeRegex(value) {
	return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getReports(req, res, next) {
	try {
		const filter = {};
		const searchValue = normalizeQueryValue(req.query.search);
		const typeValue = normalizeQueryValue(req.query.type);
		const ownerValue = normalizeQueryValue(req.query.owner);
		const limit = Number(req.query.limit) || 0;

		if (typeValue) {
			filter.type = typeValue;
		}

		if (ownerValue) {
			filter.owner = ownerValue;
		}

		if (searchValue) {
			const regex = new RegExp(escapeRegex(searchValue), "i");
			filter.$or = [{ title: regex }, { reportId: regex }, { owner: regex }, { type: regex }];
		}

		const reports = await Report.find(filter).sort({ generatedAt: -1 }).limit(limit);
		return res.json(reports);
	} catch (error) {
		return next(error);
	}
}

export async function generateReport(req, res, next) {
	try {
		const { type = "Comprehensive", owner = "District Command", metrics = {} } = req.body || {};
		const content = await buildDetailedContent(type, owner, metrics);

		const report = await Report.create({
			reportId: await generateNextId(Report, "reportId", "REP"),
			title: `${type} district operations report`,
			owner,
			type,
			content,
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

export async function generateAIReport(req, res, next) {
	try {
		const [summary, zones, categories, timeline] = await Promise.all([
			getSummaryStats(),
			getZoneStats(),
			getCategoryCounts(),
			getTimeline()
		]);

		// Prompt logic: provide real analytics payload and require a formal, operationally useful report body.
		const prompt = `Create a formal disaster situation report based on this analytics snapshot.

Summary:
${JSON.stringify(summary, null, 2)}

Zones:
${JSON.stringify(zones, null, 2)}

Categories:
${JSON.stringify(categories, null, 2)}

Timeline:
${JSON.stringify(timeline, null, 2)}

Output requirements:
- Title line
- Executive summary paragraph
- Key findings as numbered items
- Recommended actions as numbered items
- Keep tone formal and suitable for district administration.`;

		const reportText = await generateFromPrompt(
			prompt,
			"You are a disaster management analyst writing formal, concise situation reports for command leadership."
		);

		return res.json({
			report: reportText,
			generatedAt: new Date().toISOString()
		});
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

		const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
		doc.pipe(res);
		doc.on("pageAdded", () => drawHeader(doc, report));

		drawCoverPage(doc, report);
		doc.addPage();

		doc.fontSize(20).fillColor("#0f172a").text("Saarthi District Operations Report", { align: "left" });
		doc.moveDown(0.6);
		doc.fontSize(12).fillColor("#1f2937").text(`Report ID: ${report.reportId}`);
		doc.text(`Title: ${report.title}`);
		doc.text(`Owner: ${report.owner}`);
		doc.text(`Type: ${report.type}`);
		doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
		doc.moveDown(1.2);

		doc.fontSize(14).fillColor("#0f172a").text("Executive Summary", { underline: true });
		doc.moveDown(0.4);
		doc.fontSize(11).fillColor("#1f2937").text(String(report.content?.summary || "No summary available."), {
			lineGap: 4,
			align: "left"
		});

		doc.moveDown(1);
		doc.fontSize(14).fillColor("#0f172a").text("Core Metrics", { underline: true });
		doc.moveDown(0.35);

		const metrics = report.content?.metrics || {};
		const metricEntries = Object.entries(metrics);
		if (!metricEntries.length) {
			doc.fontSize(11).fillColor("#4b5563").text("No metrics provided.");
		} else {
			for (const [key, value] of metricEntries) {
				ensureSpace(doc, 20);
				doc
					.fontSize(11)
					.fillColor("#1f2937")
					.text(`${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`);
			}
		}

		const sections = Array.isArray(report.content?.sections) ? report.content.sections : [];
		if (sections.length) {
			doc.addPage();
			doc.fontSize(16).fillColor("#0f172a").text("Detailed Module Sections", { underline: true });
			doc.moveDown(0.8);
			doc.fontSize(10).fillColor("#334155").text("Section Index", { underline: true });
			doc.moveDown(0.35);
			sections.forEach((entry, index) => {
				doc.fontSize(10).fillColor("#1f2937").text(`${index + 1}. ${entry.title} - ${asText(entry.subtitle)}`);
			});

			sections.forEach((entry, index) => {
				doc.addPage();
				doc.fontSize(14).fillColor("#0f172a").text(`${index + 1}. ${entry.title}`);
				doc.moveDown(0.2);
				doc.fontSize(10).fillColor("#4b5563").text(asText(entry.subtitle));
				doc.moveDown(0.35);

				const highlights = Array.isArray(entry.highlights) ? entry.highlights : [];
				for (const highlight of highlights) {
					ensureSpace(doc, 18);
					doc.fontSize(10).fillColor("#1f2937").text(`- ${asText(highlight)}`);
				}

				if (Array.isArray(entry.rows) && entry.rows.length) {
					ensureSpace(doc, 36);
					doc.moveDown(0.25);
					drawStructuredTable(doc, entry.rows);
				}

				doc.moveDown(0.8);
			});
		}

		doc.addPage();
		drawApprovalSection(doc);

		const pageRange = doc.bufferedPageRange();
		for (let i = 0; i < pageRange.count; i += 1) {
			doc.switchToPage(i);
			drawFooter(doc, i + 1, pageRange.count);
		}

		doc.end();
		return;

	} catch (error) {
		return next(error);
	}
}
