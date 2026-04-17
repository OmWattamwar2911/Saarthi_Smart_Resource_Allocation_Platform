import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reportsApi } from "../services/api";

export default function Reports() {
	const queryClient = useQueryClient();
	const { data: reports = [], isLoading } = useQuery({ queryKey: ["reports"], queryFn: reportsApi.list });
	const generate = useMutation({
		mutationFn: () => reportsApi.generate({ type: "Impact", owner: "District Command", metrics: { generatedFrom: "frontend" } }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] })
	});

	async function openReport(id) {
		try {
			const blob = await reportsApi.openPdfBlob(id);
			const objectUrl = URL.createObjectURL(blob);
			window.open(objectUrl, "_blank", "noopener,noreferrer");

			setTimeout(() => {
				URL.revokeObjectURL(objectUrl);
			}, 60000);
		} catch {
			alert("Unable to open report PDF right now. Please try again.");
		}
	}

	return (
		<section className="page">
			<section className="panel">
				<header className="panel-head">
					<h2 className="section-title">Reports & Compliance</h2>
					<p className="section-subtitle">Operational summaries for district administration and NGOs</p>
				</header>

				<div className="panel-body">
					<button className="primary-btn" onClick={() => generate.mutate()} style={{ marginBottom: "0.8rem" }}>Generate Report</button>
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
							{isLoading ? <tr><td colSpan="5">Loading...</td></tr> : null}
							{reports.map((entry) => (
								<tr key={entry.reportId}>
									<td>{entry.reportId}</td>
									<td>{entry.title}</td>
									<td>{entry.owner}</td>
									<td>{new Date(entry.lastUpdated).toLocaleString()}</td>
									<td>
										<button className="soft-btn" onClick={() => openReport(entry.reportId)}>Open PDF</button>
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
