import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { matchesApi } from "../services/api";

export default function Matching() {
	const queryClient = useQueryClient();
	const { data: matches = [], isLoading } = useQuery({ queryKey: ["matches"], queryFn: () => matchesApi.list() });
	const generate = useMutation({ mutationFn: matchesApi.generate, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matches"] }) });
	const confirm = useMutation({ mutationFn: matchesApi.confirm, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matches"] }) });
	const reject = useMutation({ mutationFn: matchesApi.reject, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matches"] }) });

	return (
		<section className="page">
			<section className="panel">
				<header className="panel-head">
					<h2 className="section-title">AI Matching Center</h2>
					<p className="section-subtitle">Recommended teams ranked by route, skill and urgency</p>
				</header>

				<div className="panel-body">
					<button className="primary-btn" onClick={() => generate.mutate()} style={{ marginBottom: "0.8rem" }}>
						Generate AI Matches
					</button>
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
								{isLoading ? <tr><td colSpan="6">Loading...</td></tr> : null}
							{matches.map((match) => (
								<tr key={match.matchId}>
									<td>{match.matchId}</td>
									<td>{match.needId?.title || "-"}</td>
									<td>{match.suggestedTeam}</td>
									<td>{match.eta} min</td>
									<td>{match.confidence}%</td>
									<td>
										<div className="actions">
											<button className="primary-btn" onClick={() => confirm.mutate(match.matchId)}>Confirm</button>
											<button className="danger-btn" onClick={() => reject.mutate(match.matchId)}>Reject</button>
										</div>
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
