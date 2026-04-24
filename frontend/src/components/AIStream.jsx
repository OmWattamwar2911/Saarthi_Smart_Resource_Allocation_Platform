export default function AIStream({
	lines,
	onRunAnalysis,
	onGenerateReport,
	isRunning = false,
	isGeneratingReport = false
}) {
	return (
		<section className="panel">
			<header className="panel-head">
				<h2 className="section-title">AI Live Reasoning</h2>
				<p className="section-subtitle">Streaming volunteer matching analysis</p>
			</header>

			<div className="panel-body">
				<div className="ai-stream-box">
					{lines.map((line, index) => (
						<p key={`${index}-${line}`}>{line}</p>
					))}
				</div>

				<div className="actions">
										<button
											className="soft-btn"
											onClick={onRunAnalysis}
											disabled={isRunning}
										>
											{isRunning ? "Running..." : "Run AI Analysis"}
										</button>
										<button
											className="primary-btn"
											onClick={onGenerateReport}
											disabled={isGeneratingReport}
										>
											{isGeneratingReport ? "Generating..." : "Generate Report"}
										</button>
				</div>
			</div>
		</section>
	);
}
