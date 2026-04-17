import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "../services/api";

function levelColor(level) {
	if (level === "Critical") return "var(--critical)";
	if (level === "High") return "var(--high)";
	return "var(--medium)";
}

export default function Alerts() {
	const queryClient = useQueryClient();
	const { data: alerts = [], isLoading } = useQuery({ queryKey: ["alerts"], queryFn: () => alertsApi.list() });
	const escalate = useMutation({ mutationFn: alertsApi.escalate, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }) });
	const resolve = useMutation({ mutationFn: alertsApi.resolve, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }) });

	return (
		<section className="page">
			<section className="panel">
				<header className="panel-head">
					<h2 className="section-title">Alerts & Escalations</h2>
					<p className="section-subtitle">Live operational warnings requiring acknowledgement</p>
				</header>

				<div className="panel-body need-list">
					{isLoading ? <p className="muted">Loading alerts...</p> : null}
					{alerts.map((alert) => (
						<article key={alert.alertId} className="need-card" style={{ gridTemplateColumns: "1fr auto" }}>
							<div>
								<p className="need-title">{alert.message}</p>
								<p className="need-meta">
									{alert.alertId} · {alert.zone}
								</p>
							</div>
							<div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
								<span className="tag" style={{ background: "transparent", color: levelColor(alert.severity), border: `1px solid ${levelColor(alert.severity)}` }}>
									{alert.severity}
								</span>
								<button className="danger-btn" onClick={() => escalate.mutate(alert.alertId)}>Escalate</button>
								<button className="soft-btn" onClick={() => resolve.mutate(alert.alertId)}>Resolve</button>
							</div>
						</article>
					))}
				</div>
			</section>
		</section>
	);
}
