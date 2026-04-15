export function buildWeeklyForecast() {
	const base = [22, 31, 47, 38, 52, 44, 29];
	const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

	return labels.map((day, idx) => ({
		day,
		predictedNeeds: base[idx]
	}));
}

