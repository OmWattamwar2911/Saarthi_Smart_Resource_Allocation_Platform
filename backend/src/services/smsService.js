export async function sendAssignmentSms({ to, volunteerName, needSummary }) {
	return {
		success: true,
		provider: "mock",
		to,
		message: `Assigned: ${volunteerName} -> ${needSummary}`,
		sentAt: new Date().toISOString()
	};
}

