import { reportEntries } from "../data/mockData";

export default function Reports() {
	return (
		<section className="page">
			<section className="panel">
				<header className="panel-head">
					<h2 className="section-title">Reports & Compliance</h2>
					<p className="section-subtitle">Operational summaries for district administration and NGOs</p>
				</header>

				<div className="panel-body">
					<table className="table">
						<thead>
							<tr>
								<th>Report ID</th>
								<th>Title</th>
								<th>Owner</th>
								<th>Last Updated</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{reportEntries.map((entry) => (
								<tr key={entry.id}>
									<td>{entry.id}</td>
									<td>{entry.report}</td>
									<td>{entry.owner}</td>
									<td>{entry.updated}</td>
									<td>
										<button className="soft-btn">Open PDF</button>
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
