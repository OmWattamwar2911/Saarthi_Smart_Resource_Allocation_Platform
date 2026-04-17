import StatCard from "../components/StatCard";
import { priorityZones } from "../data/mockData";

export default function Analytics() {
	return (
		<section className="page">
			<div className="stat-grid">
				<StatCard title="Average Response" value="19 mins" color="var(--brand)" />
				<StatCard title="Resolution Rate" value="82%" color="var(--low)" />
				<StatCard title="Escalations" value="11" color="var(--high)" />
				<StatCard title="SLA Compliance" value="91%" color="var(--text)" />
			</div>

			<section className="panel">
				<header className="panel-head">
					<h2 className="section-title">Zone Priority Trends</h2>
					<p className="section-subtitle">Demand pressure and movement by zone</p>
				</header>

				<div className="panel-body">
					<table className="table">
						<thead>
							<tr>
								<th>Zone</th>
								<th>Priority Score</th>
								<th>Trend</th>
								<th>Dispatch Status</th>
							</tr>
						</thead>
						<tbody>
							{priorityZones.map((zone) => (
								<tr key={zone.name}>
									<td>{zone.name}</td>
									<td>{zone.score}</td>
									<td>{zone.trend}</td>
									<td>
										<span className="tag">Monitoring</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</section>
	);
}
