import NeedCard from "../components/NeedCard";
import { initialNeeds } from "../data/mockData";

export default function Needs() {
	return (
		<section className="page">
			<section className="panel">
				<header className="panel-head">
					<h2 className="section-title">Needs Queue</h2>
					<p className="section-subtitle">Verified incidents awaiting dispatch or closure</p>
				</header>

				<div className="panel-body">
					<div style={{ display: "flex", gap: "0.55rem", marginBottom: "0.8rem" }}>
						<button className="soft-btn">Filter: All</button>
						<button className="soft-btn">Urgency 4+</button>
						<button className="soft-btn">Medical</button>
						<button className="soft-btn">Unassigned</button>
					</div>

					<div className="need-list">
						{initialNeeds.map((need) => (
							<NeedCard key={need.id} need={need} />
						))}
					</div>
				</div>
			</section>
		</section>
	);
}
