import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reportsApi } from "../services/api";

export default function Reports() {
	const [reportType, setReportType] = useState("Comprehensive");
	const [aiReport, setAiReport] = useState("");
	const queryClient = useQueryClient();
	const { data: reports = [], isLoading } = useQuery({ queryKey: ["reports"], queryFn: reportsApi.list });
	const generate = useMutation({
		mutationFn: () =>
			reportsApi.generate({
				type: reportType,
				owner: "District Command",
				metrics: {
					generatedFrom: "frontend",
					reportScope: "all-pages",
					requestedAt: new Date().toISOString()
				}
			}),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] })
	});

	const generateAIReport = useMutation({
		mutationFn: () => reportsApi.aiGenerate(),
		onSuccess: (data) => {
			setAiReport(String(data?.report || ""));
		}
	});

	function copyAIReport() {
		if (!aiReport.trim()) return;
		navigator.clipboard.writeText(aiReport);
	}

	function downloadAIReport() {
		if (!aiReport.trim()) return;
		const blob = new Blob([aiReport], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `saarthi-ai-report-${Date.now()}.txt`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

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
					<div className="actions" style={{ marginBottom: "0.8rem" }}>
						<select
							className="input"
							style={{ minWidth: "220px" }}
							value={reportType}
							onChange={(event) => setReportType(event.target.value)}
						>
							<option value="Comprehensive">Comprehensive (All Modules)</option>
							<option value="Impact">Impact</option>
							<option value="Donor">Donor</option>
							<option value="Deployment">Deployment</option>
							<option value="Utilization">Utilization</option>
							<option value="Supply">Supply</option>
						</select>
						<button className="primary-btn" onClick={() => generate.mutate()} disabled={generate.isPending}>
							{generate.isPending ? "Generating..." : "Generate Detailed Report"}
						</button>
						<button
							className="soft-btn"
							onClick={() => generateAIReport.mutate()}
							disabled={generateAIReport.isPending}
						>
							{generateAIReport.isPending ? "Generating AI Report..." : "Generate AI Report"}
						</button>
					</div>

					{generateAIReport.isError ? (
						<p style={{ color: "#b91c1c" }}>
							{generateAIReport.error?.response?.data?.error || "Unable to generate AI report right now."}
						</p>
					) : null}

					{aiReport ? (
						<article
							style={{
								border: "1px solid #dbe4ee",
								borderRadius: 10,
								padding: "0.75rem",
								background: "#f8fbff",
								marginBottom: "0.9rem"
							}}
						>
							<div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.55rem", flexWrap: "wrap" }}>
								<button className="soft-btn" onClick={copyAIReport}>Copy</button>
								<button className="soft-btn" onClick={downloadAIReport}>Download .txt</button>
							</div>
							<p style={{ whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.55 }}>{aiReport}</p>
						</article>
					) : null}
					<table className="table">
						<thead>
							<tr>
								<th>Report ID</th>
								<th>Title</th>
								<th>Type</th>
								<th>Owner</th>
								<th>Last Updated</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{isLoading ? <tr><td colSpan="6">Loading...</td></tr> : null}
							{reports.map((entry) => (
								<tr key={entry.reportId}>
									<td>{entry.reportId}</td>
									<td>{entry.title}</td>
									<td>{entry.type}</td>
									<td>{entry.owner}</td>
									<td>{new Date(entry.lastUpdated || entry.generatedAt).toLocaleString()}</td>
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
