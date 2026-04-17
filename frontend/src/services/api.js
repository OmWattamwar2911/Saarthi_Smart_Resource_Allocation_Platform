import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const api = axios.create({
	baseURL: API_BASE,
	timeout: 15000
});

let authToken = localStorage.getItem("saarthi_token") || "";

export function setAuthToken(token) {
	authToken = token;
}

api.interceptors.request.use((config) => {
	if (authToken) {
		config.headers.Authorization = `Bearer ${authToken}`;
	}
	return config;
});

export const authApi = {
	login: (payload) => api.post("/auth/login", payload).then((res) => res.data),
	register: (payload) => api.post("/auth/register", payload).then((res) => res.data),
	me: () => api.get("/auth/me").then((res) => res.data)
};

export const needsApi = {
	list: (params) => api.get("/needs", { params }).then((res) => res.data),
	create: (payload) => api.post("/needs", payload).then((res) => res.data),
	assign: (id, volunteerId) => api.patch(`/needs/${id}/assign`, { volunteerId }).then((res) => res.data),
	resolve: (id) => api.patch(`/needs/${id}/resolve`).then((res) => res.data)
};

export const volunteersApi = {
	list: (params) => api.get("/volunteers", { params }).then((res) => res.data),
	create: (payload) => api.post("/volunteers", payload).then((res) => res.data),
	updateAvailability: (id, status) => api.patch(`/volunteers/${id}/availability`, { status }).then((res) => res.data)
};

export const alertsApi = {
	list: (params) => api.get("/alerts", { params }).then((res) => res.data),
	create: (payload) => api.post("/alerts", payload).then((res) => res.data),
	escalate: (id) => api.patch(`/alerts/${id}/escalate`).then((res) => res.data),
	resolve: (id) => api.patch(`/alerts/${id}/resolve`).then((res) => res.data)
};

export const matchesApi = {
	list: (params) => api.get("/matches", { params }).then((res) => res.data),
	generate: () => api.post("/matches/generate").then((res) => res.data),
	confirm: (id) => api.patch(`/matches/${id}/confirm`).then((res) => res.data),
	reject: (id) => api.patch(`/matches/${id}/reject`).then((res) => res.data)
};

export const reportsApi = {
	list: () => api.get("/reports").then((res) => res.data),
	generate: (payload) => api.post("/reports/generate", payload).then((res) => res.data),
	getPdfData: (id) => api.get(`/reports/${id}/pdf`).then((res) => res.data)
};

export const analyticsApi = {
	summary: () => api.get("/analytics/summary").then((res) => res.data),
	zones: () => api.get("/analytics/zones").then((res) => res.data),
	categories: () => api.get("/analytics/categories").then((res) => res.data),
	timeline: () => api.get("/analytics/timeline").then((res) => res.data)
};

export const settingsApi = {
	get: () => api.get("/settings").then((res) => res.data),
	update: (payload) => api.patch("/settings", payload).then((res) => res.data),
	updateZones: (zones) => api.patch("/settings/zones", { zones }).then((res) => res.data),
	reset: () => api.post("/settings/reset").then((res) => res.data)
};

export const activityApi = {
	list: (params) => api.get("/activity", { params }).then((res) => res.data)
};
