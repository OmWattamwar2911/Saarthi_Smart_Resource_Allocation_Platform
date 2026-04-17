import { volunteerPool } from "../data/mockData";

export default function Volunteers() {
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
							{volunteerPool.map((volunteer) => (
								<tr key={volunteer.id}>
									<td>{volunteer.name}</td>
									<td>{volunteer.role}</td>
									<td>{volunteer.zone}</td>
									<td>
										<span className="tag">{volunteer.availability}</span>
									</td>
									<td>{volunteer.rating}</td>
									<td>
										<button className="soft-btn">Assign</button>
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
