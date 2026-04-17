import { useEffect, useMemo, useRef, useState } from "react";
import {
	ArcElement,
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Filler,
	Legend,
	LineElement,
	LinearScale,
	PointElement,
	Tooltip
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import StatCard from "../components/StatCard";
import { analyticsApi } from "../services/api";
import { getSocket } from "../services/socket";
import HeatmapTable from "../components/HeatmapTable";
import InsightsPanel from "../components/InsightsPanel";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	LineElement,
	PointElement,
	ArcElement,
	Filler,
	Tooltip,
	Legend,
	ChartDataLabels
);

const COLORS = {
	teal: "#00BFA5",
	amber: "#F59E0B",
	coral: "#EF4444",
	blue: "#3B82F6",
	purple: "#8B5CF6",
	gray: "#9CA3AF",
	green: "#16A34A"
};

const DEFAULT_INSIGHTS = [
	{
		severity: "critical",
		title: "Critical shortage in Balotra",
		description:
			"Medical supply needs have increased 3x this week. Consider pre-positioning Doctor Team - Barmer Central."
	},
	{
		severity: "warning",
		title: "Dispatch delay in Pachpadra",
		description:
			"Avg ETA of 34 min exceeds the 30-min SLA. Nearest available team is 12 min closer."
	},
	{
		severity: "success",
		title: "High performance in Dhorimanna",
		description:
			"Zone cleared all open needs within SLA. Volunteer team available for redeployment."
	},
	{
		severity: "info",
		title: "Volunteer availability dropping",
		description:
			"Only 4 of 16 volunteers currently available. Peak demand expected Friday-Sunday."
	}
];

const SKELETON_STYLE = {
	width: "100%",
	borderRadius: 8,
	background: "linear-gradient(90deg, #f1f5f9 20%, #e5e7eb 37%, #f1f5f9 63%)",
	backgroundSize: "400% 100%",
	animation: "pulse 1.4s ease infinite"
};

function ChartSkeleton({ height = 280 }) {
	return <div style={{ ...SKELETON_STYLE, height }} />;
}

function MiniStat({ icon, value, label, trend, trendColor }) {
	return (
		<article
			style={{
				background: "#f9fafb",
				border: "1px solid #e5e7eb",
				borderRadius: 8,
				padding: 16,
				minHeight: 130
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
				<span
					style={{
						width: 30,
						height: 30,
						borderRadius: "50%",
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						background: "#e5f9f5",
						color: COLORS.teal,
						fontWeight: 700,
						fontSize: 12
					}}
				>
					{icon}
				</span>
				<strong style={{ fontSize: 28, color: "#111827", lineHeight: 1 }}>{value}</strong>
			</div>
			<p style={{ margin: 0, fontSize: 13, color: "#4b5563", lineHeight: 1.45 }}>{label}</p>
			<p style={{ margin: "10px 0 0", fontSize: 12, color: trendColor, fontWeight: 600 }}>{trend}</p>
		</article>
	);
}

function getDispatchBarColor(value) {
	if (value < 20) return "#16A34A";
	if (value <= 30) return COLORS.amber;
	return COLORS.coral;
}

function getStatusStyle(status) {
	const key = String(status || "").toLowerCase();
	if (key === "excellent") {
		return { background: "#dcfce7", color: "#15803d" };
	}
	if (key === "good") {
		return { background: "#ccfbf1", color: "#0f766e" };
	}
	if (key === "moderate") {
		return { background: "#fef3c7", color: "#b45309" };
	}
	return { background: "#fee2e2", color: "#b91c1c" };
}

function useElapsedSeconds(lastUpdated) {
	const [seconds, setSeconds] = useState(0);

	useEffect(() => {
		if (!lastUpdated) {
			setSeconds(0);
			return undefined;
		}

		const timer = setInterval(() => {
			setSeconds(Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 1000)));
		}, 1000);

		return () => clearInterval(timer);
	}, [lastUpdated]);

	return seconds;
}

export default function Analytics() {
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [insightsLoading, setInsightsLoading] = useState(false);

	const [summary, setSummary] = useState({
		openNeeds: 0,
		resolved: 0,
		escalations: 0,
		activeVolunteers: 0,
		avgDispatchMin: 0,
		aiMatchAccuracy: 87,
		avgResponseTime: 23,
		unmatchedNeeds: 2
	});
	const [zones, setZones] = useState([]);
	const [timeline, setTimeline] = useState([]);
	const [utilization, setUtilization] = useState([]);
	const [heatmap, setHeatmap] = useState({ zones: [], categories: [], matrix: {} });
	const [insights, setInsights] = useState(DEFAULT_INSIGHTS);
	const [lastUpdated, setLastUpdated] = useState(null);
	const liveRefreshTimerRef = useRef(null);

	const elapsedSeconds = useElapsedSeconds(lastUpdated);

	async function fetchAll(isManualRefresh = false) {
		if (isManualRefresh) {
			setRefreshing(true);
		} else {
			setLoading(true);
		}

		try {
			const [summaryData, zoneData, timelineData, utilizationData, heatmapData] = await Promise.all([
				analyticsApi.summary(),
				analyticsApi.zones(),
				analyticsApi.timeline(),
				analyticsApi.volunteerUtilization(),
				analyticsApi.heatmap()
			]);

			setSummary({
				openNeeds: summaryData?.openNeeds || 0,
				resolved: summaryData?.resolved || 0,
				escalations: summaryData?.escalations || 0,
				activeVolunteers: summaryData?.activeVolunteers || 0,
				avgDispatchMin: summaryData?.avgDispatchMin || 0,
				aiMatchAccuracy: summaryData?.aiMatchAccuracy || 0,
				avgResponseTime: summaryData?.avgResponseTime || 0,
				unmatchedNeeds: summaryData?.unmatchedNeeds || 0
			});

			setZones(Array.isArray(zoneData) ? zoneData : []);
			setTimeline(Array.isArray(timelineData) ? timelineData : []);
			setUtilization(Array.isArray(utilizationData) ? utilizationData : []);
			setHeatmap(heatmapData || { zones: [], categories: [], matrix: {} });
			setLastUpdated(new Date());
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}

	useEffect(() => {
		fetchAll();
	}, []);

	useEffect(() => {
		const socket = getSocket();
		const scheduleRefresh = () => {
			if (liveRefreshTimerRef.current) {
				clearTimeout(liveRefreshTimerRef.current);
			}

			liveRefreshTimerRef.current = setTimeout(() => {
				fetchAll(true);
			}, 350);
		};

		const liveEvents = [
			"analytics:update",
			"need:created",
			"need:updated",
			"volunteer:updated",
			"match:generated",
			"alert:new"
		];

		liveEvents.forEach((eventName) => socket.on(eventName, scheduleRefresh));

		return () => {
			liveEvents.forEach((eventName) => socket.off(eventName, scheduleRefresh));
			if (liveRefreshTimerRef.current) {
				clearTimeout(liveRefreshTimerRef.current);
			}
		};
	}, []);

	async function regenerateInsights() {
		setInsightsLoading(true);
		try {
			const response = await analyticsApi.insights();
			if (Array.isArray(response) && response.length) {
				setInsights(response.slice(0, 4));
			}
		} finally {
			setInsightsLoading(false);
		}
	}

	const zonePriorityData = useMemo(
		() => ({
			labels: zones.map((item) => item.zone),
			datasets: [
				{
					label: "Priority",
					data: zones.map((item) => Number(item.priorityScore || 0)),
					backgroundColor: COLORS.teal,
					borderRadius: 6,
					borderWidth: 0,
					maxBarThickness: 36
				}
			]
		}),
		[zones]
	);

	const categoryCounts = useMemo(() => {
		const totals = {
			Medical: 0,
			Shelter: 0,
			"Food & Water": 0,
			Education: 0,
			Logistics: 0
		};

		for (const zone of zones) {
			totals.Medical += Number(zone.categories?.medical || 0);
			totals.Shelter += Number(zone.categories?.shelter || 0);
			totals["Food & Water"] += Number(zone.categories?.food || 0);
			totals.Education += Number(zone.categories?.education || 0);
			totals.Logistics += Number(zone.categories?.logistics || 0);
		}

		return totals;
	}, [zones]);

	const categoryTotal = useMemo(
		() => Object.values(categoryCounts).reduce((sum, value) => sum + Number(value || 0), 0),
		[categoryCounts]
	);

	const categoryDonutData = useMemo(
		() => ({
			labels: ["Medical", "Shelter", "Food & Water", "Education", "Logistics"],
			datasets: [
				{
					data: [
						categoryCounts.Medical,
						categoryCounts.Shelter,
						categoryCounts["Food & Water"],
						categoryCounts.Education,
						categoryCounts.Logistics
					],
					backgroundColor: [COLORS.coral, COLORS.blue, COLORS.amber, COLORS.purple, COLORS.teal],
					borderWidth: 0,
					hoverOffset: 2
				}
			]
		}),
		[categoryCounts]
	);

	const utilizationData = useMemo(
		() => ({
			labels: utilization.map((item) => item.day),
			datasets: [
				{
					label: "Deployed",
					data: utilization.map((item) => item.deployed),
					borderColor: COLORS.teal,
					backgroundColor: COLORS.teal,
					pointRadius: 4,
					pointHoverRadius: 5,
					borderWidth: 2,
					tension: 0.3
				},
				{
					label: "Available",
					data: utilization.map((item) => item.available),
					borderColor: COLORS.gray,
					backgroundColor: COLORS.gray,
					borderDash: [6, 4],
					pointRadius: 4,
					pointHoverRadius: 5,
					borderWidth: 2,
					tension: 0.3
				}
			]
		}),
		[utilization]
	);

	const dispatchData = useMemo(
		() => ({
			labels: zones.map((item) => item.zone),
			datasets: [
				{
					label: "Avg dispatch time",
					data: zones.map((item) => Number(item.avgDispatchMin || 0)),
					backgroundColor: zones.map((item) => getDispatchBarColor(Number(item.avgDispatchMin || 0))),
					borderWidth: 0,
					borderRadius: 6,
					maxBarThickness: 18
				}
			]
		}),
		[zones]
	);

	const timelineData = useMemo(
		() => ({
			labels: timeline.map((item) => item.week),
			datasets: [
				{
					label: "New Needs",
					data: timeline.map((item) => Number(item.newNeeds || 0)),
					borderColor: COLORS.teal,
					backgroundColor: "rgba(0, 191, 165, 0.3)",
					fill: true,
					borderWidth: 2,
					tension: 0.35,
					pointRadius: 3
				},
				{
					label: "Resolved",
					data: timeline.map((item) => Number(item.resolved || 0)),
					borderColor: COLORS.green,
					backgroundColor: "rgba(22, 163, 74, 0.3)",
					fill: true,
					borderWidth: 2,
					tension: 0.35,
					pointRadius: 3
				},
				{
					label: "Escalated",
					data: timeline.map((item) => Number(item.escalated || 0)),
					borderColor: COLORS.coral,
					backgroundColor: "rgba(239, 68, 68, 0.3)",
					fill: true,
					borderWidth: 2,
					tension: 0.35,
					pointRadius: 3
				}
			]
		}),
		[timeline]
	);

	const topZones = useMemo(() => {
		const sorted = [...zones].sort((a, b) => Number(b.resolvedNeeds || 0) - Number(a.resolvedNeeds || 0));
		return sorted.slice(0, 6).map((zone, index) => ({
			rank: index + 1,
			zone: zone.zone,
			resolved: zone.resolvedNeeds || 0,
			eta: zone.avgDispatchMin || 0,
			status: zone.status || "Moderate"
		}));
	}, [zones]);

	const commonScaleOptions = {
		grid: {
			color: "#f0f0f0",
			borderDash: [4, 4],
			drawBorder: false
		},
		border: {
			display: false
		},
		ticks: {
			color: "#6b7280",
			font: {
				size: 12
			}
		}
	};

	return (
		<section className="page">
			<div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginBottom: 12 }}>
				<button
					className="soft-btn"
					onClick={() => fetchAll(true)}
					disabled={refreshing}
					style={{ borderColor: COLORS.teal, color: COLORS.teal }}
				>
					{refreshing ? "Refreshing..." : "Refresh Data"}
				</button>
				<span style={{ fontSize: 12, color: "#6b7280" }}>
					Live stream active | Last updated: {lastUpdated ? `${elapsedSeconds} seconds ago` : "Never"}
				</span>
			</div>

			<div className="stat-grid">
				<StatCard title="Open Needs" value={summary.openNeeds || 0} color="var(--brand)" />
				<StatCard title="Resolved" value={summary.resolved || 0} color="var(--text)" />
				<StatCard title="Escalations" value={summary.escalations || 0} color="var(--high)" />
				<StatCard title="Active Volunteers" value={summary.activeVolunteers || 0} color="var(--text)" />
			</div>

			<section className="panel">
				<header className="panel-head">
					<h2 className="section-title">Zone Priority Trends</h2>
					<p className="section-subtitle">Demand pressure and movement by zone</p>
				</header>

				<div className="panel-body two-col">
					<div style={{ height: 280, minHeight: 280, minWidth: 0 }}>
						{loading ? (
							<ChartSkeleton height={280} />
						) : (
							<Bar
								data={zonePriorityData}
								options={{
									responsive: true,
									maintainAspectRatio: false,
									plugins: {
										legend: { display: false }
									},
									scales: {
										x: commonScaleOptions,
										y: {
											...commonScaleOptions,
											beginAtZero: true
										}
									}
								}}
							/>
						)}
					</div>

					<div style={{ minHeight: 280, minWidth: 0 }}>
						<h3 className="section-title" style={{ fontSize: 16, margin: "0 0 2px" }}>Needs by Category</h3>
						<p className="section-subtitle" style={{ marginBottom: 10 }}>Current open need distribution</p>

						{loading ? (
							<ChartSkeleton height={230} />
						) : (
							<div style={{ height: 190, maxWidth: 300, margin: "0 auto" }}>
								<Doughnut
									data={categoryDonutData}
									options={{
										responsive: true,
										maintainAspectRatio: false,
										cutout: "68%",
										plugins: {
											legend: { display: false }
										}
									}}
								/>
							</div>
						)}

						<div style={{ display: "grid", gap: 6, marginTop: 14 }}>
							{Object.entries(categoryCounts).map(([label, value], idx) => {
								const colors = [COLORS.coral, COLORS.blue, COLORS.amber, COLORS.purple, COLORS.teal];
								const percent = categoryTotal ? Math.round((Number(value || 0) / categoryTotal) * 100) : 0;
								return (
									<div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "#4b5563" }}>
										<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
											<span style={{ width: 10, height: 10, borderRadius: 2, background: colors[idx] }} />
											{label}
										</span>
										<strong style={{ color: "#111827" }}>{percent}%</strong>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</section>

			<section className="panel">
				<div className="panel-body two-col">
					<div>
						<header className="panel-head" style={{ padding: 0, marginBottom: 14 }}>
							<h2 className="section-title">Volunteer Utilization (7 days)</h2>
							<p className="section-subtitle">Deployed vs available per day</p>
						</header>
						<div style={{ height: 280 }}>
							{loading ? (
								<ChartSkeleton height={280} />
							) : (
								<Line
									data={utilizationData}
									options={{
										responsive: true,
										maintainAspectRatio: false,
										plugins: {
											legend: {
												display: true,
												position: "top",
												align: "end",
												labels: { boxWidth: 10, boxHeight: 10 }
											},
											datalabels: { display: false }
										},
										scales: {
											x: commonScaleOptions,
											y: {
												...commonScaleOptions,
												beginAtZero: true,
												min: 0,
												max: 20
											}
										}
									}}
								/>
							)}
						</div>
					</div>

					<div>
						<header className="panel-head" style={{ padding: 0, marginBottom: 14 }}>
							<h2 className="section-title">Avg Dispatch Time by Zone</h2>
							<p className="section-subtitle">Minutes from need creation to volunteer dispatch</p>
						</header>
						<div style={{ height: 280 }}>
							{loading ? (
								<ChartSkeleton height={280} />
							) : (
								<Bar
									data={dispatchData}
									options={{
										indexAxis: "y",
										responsive: true,
										maintainAspectRatio: false,
										plugins: {
											legend: { display: false },
											datalabels: {
												color: "#374151",
												anchor: "end",
												align: "right",
												formatter: (value) => `${value} min`,
												font: { weight: 600 }
											}
										},
										scales: {
											x: {
												...commonScaleOptions,
												min: 0,
												max: 40
											},
											y: commonScaleOptions
										}
									}}
								/>
							)}
						</div>
					</div>
				</div>
			</section>

			<section className="panel">
				<header className="panel-head">
					<h2 className="section-title">Need Resolution Timeline (30 days)</h2>
					<p className="section-subtitle">Weekly trend of new, resolved, and escalated needs</p>
				</header>
				<div className="panel-body" style={{ height: 320 }}>
					{loading ? (
						<ChartSkeleton height={300} />
					) : (
						<Line
							data={timelineData}
							options={{
								responsive: true,
								maintainAspectRatio: false,
								plugins: {
									legend: {
										display: true,
										position: "top",
										align: "start"
									},
									datalabels: { display: false }
								},
								interaction: {
									mode: "index",
									intersect: false
								},
								scales: {
									x: commonScaleOptions,
									y: {
										...commonScaleOptions,
										stacked: true,
										beginAtZero: true,
										min: 0,
										max: 15
									}
								}
							}}
						/>
					)}
				</div>
			</section>

			<section style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, marginBottom: 20 }}>
				<MiniStat
					icon="A"
					value={`${summary.aiMatchAccuracy || 0}%`}
					label="Avg confidence score across all matches"
					trend="+4% vs last week"
					trendColor="#15803d"
				/>
				<MiniStat
					icon="R"
					value={`${summary.avgResponseTime || 0} min`}
					label="From need submission to first volunteer dispatch"
					trend="-5 min vs last week"
					trendColor="#15803d"
				/>
				<MiniStat
					icon="U"
					value={summary.unmatchedNeeds || 0}
					label="Needs with no suitable volunteer found"
					trend="Same as last week"
					trendColor="#6b7280"
				/>
			</section>

			<section className="two-col" style={{ alignItems: "stretch", marginBottom: 20 }}>
				<section className="panel" style={{ marginBottom: 0 }}>
					<header className="panel-head">
						<h2 className="section-title">Top Performing Zones</h2>
						<p className="section-subtitle">Ranked by resolved needs and ETA efficiency</p>
					</header>
					<div className="panel-body" style={{ paddingTop: 0 }}>
						<div style={{ overflowX: "auto" }}>
							<table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, borderRadius: 8, overflow: "hidden" }}>
								<thead>
									<tr>
										{[
											"Rank",
											"Zone",
											"Needs Resolved",
											"Avg ETA",
											"Status"
										].map((head) => (
											<th
												key={head}
												style={{
													textAlign: "left",
													fontSize: 12,
													color: "#6b7280",
													background: "#f3f4f6",
													padding: 12,
													fontWeight: 600
												}}
											>
												{head}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{topZones.map((row, index) => {
										const statusStyle = getStatusStyle(row.status);
										return (
											<tr key={row.zone} style={{ background: index % 2 === 0 ? "#ffffff" : "#fcfcfd" }}>
												<td style={{ padding: 12, fontSize: 13 }}>{row.rank}</td>
												<td style={{ padding: 12, fontSize: 13, fontWeight: 500 }}>{row.zone}</td>
												<td style={{ padding: 12, fontSize: 13 }}>{row.resolved}</td>
												<td style={{ padding: 12, fontSize: 13 }}>{row.eta} min</td>
												<td style={{ padding: 12, fontSize: 13 }}>
													<span
														style={{
															display: "inline-flex",
															alignItems: "center",
															padding: "2px 8px",
															borderRadius: 999,
															fontSize: 12,
															fontWeight: 600,
															...statusStyle
														}}
													>
														{row.status}
													</span>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				</section>

				<InsightsPanel insights={insights} loading={insightsLoading} onRegenerate={regenerateInsights} />
			</section>

			<section className="panel">
				<header className="panel-head">
					<h2 className="section-title">Zone x Category Urgency Matrix</h2>
					<p className="section-subtitle">Color intensity = urgency pressure (0-10)</p>
				</header>
				<div className="panel-body">
					{loading ? (
						<ChartSkeleton height={270} />
					) : (
						<HeatmapTable zones={heatmap.zones || []} categories={heatmap.categories || []} matrix={heatmap.matrix || {}} />
					)}
				</div>
			</section>
		</section>
	);
}
