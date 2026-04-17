import StatCard from "../components/StatCard";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { analyticsApi } from "../services/api";

export default function Analytics() {
	const { data: summary = {} } = useQuery({ queryKey: ["analytics-summary"], queryFn: analyticsApi.summary });
	const { data: zones = [] } = useQuery({ queryKey: ["analytics-zones"], queryFn: analyticsApi.zones });
	const { data: timeline = [] } = useQuery({ queryKey: ["analytics-timeline"], queryFn: analyticsApi.timeline });

	return (
		<section className="page">
			<div className="stat-grid">
				<StatCard title="Open Needs" value={summary.openNeeds || 0} color="var(--brand)" />
				<StatCard title="Resolved" value={summary.resolvedNeeds || 0} color="var(--low)" />
				<StatCard title="Escalations" value={summary.escalatedAlerts || 0} color="var(--high)" />
				<StatCard title="Active Volunteers" value={summary.activeVolunteers || 0} color="var(--text)" />
			</div>

			<section className="panel">
				<header className="panel-head">
					<h2 className="section-title">Zone Priority Trends</h2>
					<p className="section-subtitle">Demand pressure and movement by zone</p>
				</header>

				<div className="panel-body two-col">
					<div style={{ height: 260, minHeight: 260, minWidth: 0 }}>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={zones}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="zone" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="priorityScore" fill="#2f8f82" />
							</BarChart>
						</ResponsiveContainer>
					</div>
					<div style={{ height: 260, minHeight: 260, minWidth: 0 }}>
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={timeline}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="label" />
								<YAxis />
								<Tooltip />
								<Line type="monotone" dataKey="open" stroke="#c44a58" />
								<Line type="monotone" dataKey="resolved" stroke="#3e8660" />
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>
			</section>
		</section>
	);
}
