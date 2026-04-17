import { useVolunteers, useUpdateAvailability } from "../hooks/useVolunteers";

export default function Volunteers() {
	const { data: volunteers = [], isLoading } = useVolunteers({});
	const updateAvailability = useUpdateAvailability();

	return (
		<section className="page">
			<section className="panel">
				<header className="panel-head">
					<h2 className="section-title">Volunteer Coordination</h2>
					<p className="section-subtitle">Manage availability, skills and dispatch readiness</p>
				</header>

				<div className="panel-body">
					<table className="table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Role</th>
								<th>Zone</th>
								<th>Availability</th>
								<th>Rating</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{isLoading ? <tr><td colSpan="6">Loading...</td></tr> : null}
							{volunteers.map((volunteer) => (
								<tr key={volunteer.volunteerId}>
									<td>{volunteer.name}</td>
									<td>{volunteer.role}</td>
									<td>{volunteer.zone}</td>
									<td>
										<span className="tag">{volunteer.availability}</span>
									</td>
									<td>{volunteer.rating}</td>
									<td>
										<select
											className="input"
											value={volunteer.availability}
											onChange={(e) => updateAvailability.mutate({ volunteerId: volunteer.volunteerId, status: e.target.value })}
										>
											<option>Available</option>
											<option>On Route</option>
											<option>Assigned</option>
											<option>Off Duty</option>
										</select>
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
