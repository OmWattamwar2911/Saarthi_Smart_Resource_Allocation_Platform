import { aiRecommendations } from "../data/mockData";

export default function Matching() {
	return (
		<section className="page">
			<section className="panel">
				<header className="panel-head">
					<h2 className="section-title">AI Matching Center</h2>
					<p className="section-subtitle">Recommended teams ranked by route, skill and urgency</p>
				</header>

				<div className="panel-body">
					<table className="table">
						<thead>
							<tr>
								<th>Match ID</th>
								<th>Need</th>
								<th>Suggested Team</th>
								<th>ETA</th>
								<th>Confidence</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{aiRecommendations.map((match) => (
								<tr key={match.id}>
									<td>{match.id}</td>
									<td>{match.need}</td>
									<td>{match.suggestedTeam}</td>
									<td>{match.eta}</td>
									<td>{match.confidence}%</td>
									<td>
										<button className="primary-btn">Confirm</button>
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
