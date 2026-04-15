export function logInfo(message, data) {
	if (data !== undefined) {
		console.log(`[INFO] ${message}`, data);
		return;
	}
	console.log(`[INFO] ${message}`);
}

export function logWarn(message, data) {
	if (data !== undefined) {
		console.warn(`[WARN] ${message}`, data);
		return;
	}
	console.warn(`[WARN] ${message}`);
}

