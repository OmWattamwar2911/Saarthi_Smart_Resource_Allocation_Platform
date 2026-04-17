export default function AIStream({ lines }) {
	return (
		<section className="panel">
			<header className="panel-head">
				<h2 className="section-title">AI Live Reasoning</h2>
				<p className="section-subtitle">Streaming volunteer matching analysis</p>
			</header>

			<div className="panel-body">
				<div className="ai-stream-box">
					{lines.map((line) => (
						<p key={line}>{line}</p>
					))}
				</div>

				<div className="actions">
					<button className="soft-btn">Run AI Analysis</button>
					<button className="primary-btn">Generate Report</button>
				</div>
			</div>
		</section>
	);
}
