import { useState } from "react";
import NeedCard from "../components/NeedCard";
import { useCreateNeed, useNeeds, useResolveNeed } from "../hooks/useNeeds";

export default function Needs() {
	const [filter, setFilter] = useState({ status: "", urgency: "" });
	const [draft, setDraft] = useState({ title: "", location: "", zone: "Barmer Central", category: "Medical", urgency: 3 });
	const { data: needs = [], isLoading } = useNeeds(filter);
	const createNeed = useCreateNeed();
	const resolveNeed = useResolveNeed();

	async function handleCreate() {
		if (!draft.title || !draft.location) return;
		await createNeed.mutateAsync(draft);
		setDraft((prev) => ({ ...prev, title: "", location: "" }));
	}

	return (
		<section className="page">
			<section className="panel">
				<header className="panel-head">
					<h2 className="section-title">Needs Queue</h2>
					<p className="section-subtitle">Verified incidents awaiting dispatch or closure</p>
				</header>

				<div className="panel-body">
					<div style={{ display: "flex", gap: "0.55rem", marginBottom: "0.8rem" }}>
						<button className="soft-btn" onClick={() => setFilter({ status: "", urgency: "" })}>All</button>
						<button className="soft-btn" onClick={() => setFilter((prev) => ({ ...prev, urgency: 4 }))}>Urgency 4+</button>
						<button className="soft-btn" onClick={() => setFilter((prev) => ({ ...prev, status: "Open" }))}>Open</button>
						<button className="soft-btn" onClick={() => setFilter((prev) => ({ ...prev, status: "Assigned" }))}>Assigned</button>
					</div>

					<div className="two-col" style={{ marginBottom: "0.8rem" }}>
						<input className="input" placeholder="Need title" value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} />
						<input className="input" placeholder="Location" value={draft.location} onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))} />
						<select className="input" value={draft.zone} onChange={(e) => setDraft((prev) => ({ ...prev, zone: e.target.value }))}>
							<option>Barmer Central</option>
							<option>Barmer East</option>
							<option>Siwana</option>
							<option>Balotra</option>
							<option>Gudamalani</option>
							<option>Dhrimanna</option>
							<option>Pachpadra</option>
						</select>
						<select className="input" value={draft.category} onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}>
							<option>Medical</option>
							<option>Food</option>
							<option>Shelter</option>
							<option>Water</option>
							<option>Education</option>
						</select>
						<select className="input" value={draft.urgency} onChange={(e) => setDraft((prev) => ({ ...prev, urgency: Number(e.target.value) }))}>
							<option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option><option value={5}>5</option>
						</select>
						<button className="primary-btn" onClick={handleCreate}>Create Need</button>
					</div>

					<div className="need-list">
						{isLoading ? <p className="muted">Loading needs...</p> : null}
						{needs.map((need) => (
							<div key={need.needId}>
								<NeedCard need={need} />
								<div className="actions" style={{ marginTop: "0.4rem" }}>
									<button className="soft-btn" onClick={() => resolveNeed.mutate(need.needId)}>Resolve</button>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>
		</section>
	);
}
