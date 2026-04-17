import { useMemo, useState } from "react";
import { useVolunteers, useUpdateAvailability } from "../hooks/useVolunteers";

const DEFAULT_FILTERS = {
	search: "",
	zone: "",
	role: "",
	availability: "",
	sort: "name"
};

export default function Volunteers() {
	const [filters, setFilters] = useState(DEFAULT_FILTERS);
	const queryParams = useMemo(
		() => ({
			search: filters.search,
			zone: filters.zone,
			role: filters.role,
			availability: filters.availability,
			sort: filters.sort
		}),
		[filters]
	);

	const { data: volunteers = [], isLoading } = useVolunteers(queryParams);
	const updateAvailability = useUpdateAvailability();

	const zones = useMemo(() => [...new Set(volunteers.map((volunteer) => volunteer.zone).filter(Boolean))], [volunteers]);
	const roles = useMemo(() => [...new Set(volunteers.map((volunteer) => volunteer.role).filter(Boolean))], [volunteers]);

	const stats = useMemo(() => {
		const total = volunteers.length;
		const available = volunteers.filter((volunteer) => volunteer.availability === "Available").length;
		const active = volunteers.filter((volunteer) => ["Available", "On Route", "Assigned"].includes(volunteer.availability)).length;
		const offDuty = volunteers.filter((volunteer) => volunteer.availability === "Off Duty").length;
		return { total, available, active, offDuty };
	}, [volunteers]);

	const isUpdating = updateAvailability.isPending;

	function setFilter(key, value) {
		setFilters((prev) => ({ ...prev, [key]: value }));
	}

	function quickSetStatus(volunteerId, status) {
		updateAvailability.mutate({ volunteerId, status });
	}

	return (
		<section className="page">
			<section className="panel">
				<header className="panel-head">
					<h2 className="section-title">Volunteer Coordination</h2>
					<p className="section-subtitle">Manage availability, skills and dispatch readiness</p>
				</header>

				<div className="panel-body">
					<div className="stat-grid" style={{ marginBottom: "0.9rem" }}>
						<article className="stat-card"><p className="muted">Total</p><h3>{stats.total}</h3></article>
						<article className="stat-card"><p className="muted">Available</p><h3>{stats.available}</h3></article>
						<article className="stat-card"><p className="muted">Active</p><h3>{stats.active}</h3></article>
						<article className="stat-card"><p className="muted">Off Duty</p><h3>{stats.offDuty}</h3></article>
					</div>

					<div className="two-col" style={{ gap: "0.55rem", marginBottom: "0.8rem" }}>
						<input
							className="input"
							placeholder="Search volunteer, ID, role or skill"
							value={filters.search}
							onChange={(event) => setFilter("search", event.target.value)}
						/>
						<select className="input" value={filters.availability} onChange={(event) => setFilter("availability", event.target.value)}>
							<option value="">All Availability</option>
							<option value="Available">Available</option>
							<option value="On Route">On Route</option>
							<option value="Assigned">Assigned</option>
							<option value="Off Duty">Off Duty</option>
						</select>
						<select className="input" value={filters.zone} onChange={(event) => setFilter("zone", event.target.value)}>
							<option value="">All Zones</option>
							{zones.map((zone) => (
								<option key={zone} value={zone}>{zone}</option>
							))}
						</select>
						<select className="input" value={filters.role} onChange={(event) => setFilter("role", event.target.value)}>
							<option value="">All Roles</option>
							{roles.map((role) => (
								<option key={role} value={role}>{role}</option>
							))}
						</select>
						<select className="input" value={filters.sort} onChange={(event) => setFilter("sort", event.target.value)}>
							<option value="name">Sort: Name</option>
							<option value="rating">Sort: Rating</option>
							<option value="xp">Sort: XP</option>
							<option value="zone">Sort: Zone</option>
						</select>
						<button className="soft-btn" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset</button>
					</div>

					<table className="table">
						<thead>
							<tr>
								<th>ID</th>
								<th>Name</th>
								<th>Role</th>
								<th>Zone</th>
								<th>Availability</th>
								<th>Rating</th>
								<th>Tasks</th>
								<th>Skills</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{isLoading ? <tr><td colSpan="9">Loading...</td></tr> : null}
							{!isLoading && volunteers.length === 0 ? <tr><td colSpan="9">No volunteers found for selected filters.</td></tr> : null}
							{volunteers.map((volunteer) => (
								<tr key={volunteer.volunteerId}>
									<td>{volunteer.volunteerId}</td>
									<td>{volunteer.name}</td>
									<td>{volunteer.role}</td>
									<td>{volunteer.zone}</td>
									<td>
										<span className="tag">{volunteer.availability}</span>
									</td>
									<td>{volunteer.rating}</td>
									<td>{volunteer.tasksCompleted || 0}</td>
									<td>{Array.isArray(volunteer.skills) ? volunteer.skills.join(", ") : "-"}</td>
									<td>
										<div style={{ display: "grid", gap: "0.35rem" }}>
											<select
												className="input"
												value={volunteer.availability}
												disabled={isUpdating}
												onChange={(e) => updateAvailability.mutate({ volunteerId: volunteer.volunteerId, status: e.target.value })}
											>
												<option>Available</option>
												<option>On Route</option>
												<option>Assigned</option>
												<option>Off Duty</option>
											</select>
											<div className="actions" style={{ display: "flex", gap: "0.35rem" }}>
												<button className="soft-btn" disabled={isUpdating} onClick={() => quickSetStatus(volunteer.volunteerId, "Available")}>Ready</button>
												<button className="soft-btn" disabled={isUpdating} onClick={() => quickSetStatus(volunteer.volunteerId, "Off Duty")}>Off</button>
											</div>
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
