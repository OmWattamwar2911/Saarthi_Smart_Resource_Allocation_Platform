import { alertFeed } from "../data/mockData";

function levelColor(level) {
	if (level === "Critical") return "var(--critical)";
	if (level === "High") return "var(--high)";
	return "var(--medium)";
}

export default function Alerts() {
	return (
		<section className="page">
			<section className="panel">
				<header className="panel-head">
					<h2 className="section-title">Alerts & Escalations</h2>
					<p className="section-subtitle">Live operational warnings requiring acknowledgement</p>
				</header>

				<div className="panel-body need-list">
					{alertFeed.map((alert) => (
						<article key={alert.id} className="need-card" style={{ gridTemplateColumns: "1fr auto" }}>
							<div>
								<p className="need-title">{alert.message}</p>
								<p className="need-meta">
									{alert.id} · {alert.time}
								</p>
							</div>
							<div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
								<span className="tag" style={{ background: "transparent", color: levelColor(alert.level), border: `1px solid ${levelColor(alert.level)}` }}>
									{alert.level}
								</span>
								<button className="danger-btn">Escalate</button>
							</div>
						</article>
					))}
				</div>
			</section>
		</section>
	);
}
