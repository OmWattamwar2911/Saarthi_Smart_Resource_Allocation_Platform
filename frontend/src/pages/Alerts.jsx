import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "../services/api";

function levelColor(level) {
	if (level === "Critical") return "var(--critical)";
	if (level === "High") return "var(--high)";
	return "var(--medium)";
}

export default function Alerts() {
	const [filters, setFilters] = useState({ search: "", severity: "", status: "", zone: "" });
	const [draft, setDraft] = useState({ message: "", severity: "Moderate", zone: "Barmer Central" });
	const queryClient = useQueryClient();
	const { data: alerts = [], isLoading } = useQuery({ queryKey: ["alerts", filters], queryFn: () => alertsApi.list(filters) });
	const create = useMutation({ mutationFn: alertsApi.create, onSuccess: () => {
		queryClient.invalidateQueries({ queryKey: ["alerts"] });
		setDraft({ message: "", severity: "Moderate", zone: "Barmer Central" });
	} });
	const escalate = useMutation({ mutationFn: alertsApi.escalate, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }) });
	const resolve = useMutation({ mutationFn: alertsApi.resolve, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }) });

	const zones = useMemo(() => [...new Set(alerts.map((alert) => alert.zone).filter(Boolean))], [alerts]);
	const stats = useMemo(() => {
		const total = alerts.length;
		const active = alerts.filter((alert) => alert.status === "Active").length;
		const escalatedCount = alerts.filter((alert) => alert.status === "Escalated").length;
		const resolvedCount = alerts.filter((alert) => alert.status === "Resolved").length;
		const critical = alerts.filter((alert) => alert.severity === "Critical").length;
		return { total, active, escalatedCount, resolvedCount, critical };
	}, [alerts]);

	async function handleCreate() {
		if (!draft.message.trim()) return;
		create.mutate(draft);
	}

	const isBusy = create.isPending || escalate.isPending || resolve.isPending;

	return (
		<section className="page">
			<section className="panel">
				<header className="panel-head">
					<h2 className="section-title">Alerts & Escalations</h2>
					<p className="section-subtitle">Live operational warnings requiring acknowledgement</p>
				</header>

				<div className="panel-body need-list">
					<div className="stat-grid" style={{ marginBottom: "0.85rem" }}>
						<article className="stat-card"><p className="muted">Total</p><h3>{stats.total}</h3></article>
						<article className="stat-card"><p className="muted">Active</p><h3>{stats.active}</h3></article>
						<article className="stat-card"><p className="muted">Escalated</p><h3>{stats.escalatedCount}</h3></article>
						<article className="stat-card"><p className="muted">Critical</p><h3>{stats.critical}</h3></article>
					</div>

					<div className="two-col" style={{ gap: "0.55rem", marginBottom: "0.85rem" }}>
						<input
							className="input"
							placeholder="Search alerts by message, ID, zone"
							value={filters.search}
							onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
						/>
						<select className="input" value={filters.severity} onChange={(event) => setFilters((prev) => ({ ...prev, severity: event.target.value }))}>
							<option value="">All Severity</option>
							<option value="Critical">Critical</option>
							<option value="High">High</option>
							<option value="Moderate">Moderate</option>
							<option value="Low">Low</option>
						</select>
						<select className="input" value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
							<option value="">All Status</option>
							<option value="Active">Active</option>
							<option value="Escalated">Escalated</option>
							<option value="Resolved">Resolved</option>
						</select>
						<select className="input" value={filters.zone} onChange={(event) => setFilters((prev) => ({ ...prev, zone: event.target.value }))}>
							<option value="">All Zones</option>
							{zones.map((zone) => (
								<option key={zone} value={zone}>{zone}</option>
							))}
						</select>
						<button className="soft-btn" onClick={() => setFilters({ search: "", severity: "", status: "", zone: "" })}>Reset</button>
					</div>

					<div className="two-col" style={{ gap: "0.55rem", marginBottom: "0.85rem" }}>
						<input
							className="input"
							placeholder="Create alert message"
							value={draft.message}
							onChange={(event) => setDraft((prev) => ({ ...prev, message: event.target.value }))}
						/>
						<select className="input" value={draft.severity} onChange={(event) => setDraft((prev) => ({ ...prev, severity: event.target.value }))}>
							<option>Critical</option>
							<option>High</option>
							<option>Moderate</option>
							<option>Low</option>
						</select>
						<select className="input" value={draft.zone} onChange={(event) => setDraft((prev) => ({ ...prev, zone: event.target.value }))}>
							<option>Barmer Central</option>
							<option>Barmer East</option>
							<option>Siwana</option>
							<option>Balotra</option>
							<option>Gudamalani</option>
							<option>Dhorimanna</option>
							<option>Pachpadra</option>
						</select>
						<button className="primary-btn" disabled={create.isPending} onClick={handleCreate}>
							{create.isPending ? "Creating..." : "Create Alert"}
						</button>
					</div>

					{isLoading ? <p className="muted">Loading alerts...</p> : null}
					{!isLoading && alerts.length === 0 ? <p className="muted">No alerts found for selected filters.</p> : null}
					{alerts.map((alert) => (
						<article key={alert.alertId} className="need-card" style={{ gridTemplateColumns: "1fr auto" }}>
							<div>
								<p className="need-title">{alert.message}</p>
								<p className="need-meta">
									{alert.alertId} · {alert.zone} · {new Date(alert.createdAt).toLocaleString()}
								</p>
							</div>
							<div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
								<span className="tag" style={{ background: "transparent", color: levelColor(alert.severity), border: `1px solid ${levelColor(alert.severity)}` }}>
									{alert.severity}
								</span>
								<button
									className="danger-btn"
									disabled={isBusy || alert.status === "Escalated" || alert.status === "Resolved"}
									onClick={() => escalate.mutate(alert.alertId)}
								>
									Escalate
								</button>
								<button
									className="soft-btn"
									disabled={isBusy || alert.status === "Resolved"}
									onClick={() => resolve.mutate(alert.alertId)}
								>
									Resolve
								</button>
							</div>
						</article>
					))}
				</div>
			</section>
		</section>
	);
}
