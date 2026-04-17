import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "../services/api";
import { getSocket } from "../services/socket";

const AppContext = createContext(null);

export function AppProvider({ children }) {
	const queryClient = useQueryClient();
	const [notifications, setNotifications] = useState([]);
	const [theme, setTheme] = useState(() => localStorage.getItem("saarthi_theme") || "light");
	const [globalSearch, setGlobalSearch] = useState("");
	const seededRef = useRef(false);

	useEffect(() => {
		document.documentElement.dataset.theme = theme;
		localStorage.setItem("saarthi_theme", theme);
	}, [theme]);

	useEffect(() => {
		if (seededRef.current) {
			return;
		}

		seededRef.current = true;

		(async () => {
			try {
				const recentAlerts = await alertsApi.list({ limit: 10 });
				if (!Array.isArray(recentAlerts) || recentAlerts.length === 0) {
					return;
				}

				const mapped = recentAlerts.slice(0, 10).map((alert) => ({
					id: `seed-${alert.alertId || alert._id || Date.now()}`,
					type: String(alert.severity || "info").toLowerCase(),
					message: alert.message || "Operational alert",
					timestamp: alert.createdAt || alert.updatedAt || new Date().toISOString()
				}));

				setNotifications((prev) => {
					if (prev.length) {
						return prev;
					}
					return mapped;
				});
			} catch {
				// Notifications still work through socket events even if initial alert fetch fails.
			}
		})();
	}, []);

	useEffect(() => {
		const socket = getSocket();
		const pushNotification = (message, type = "info", timestamp = new Date().toISOString()) => {
			setNotifications((prev) => {
				const entry = {
					id: `${Date.now()}-${Math.floor(Math.random() * 9999)}`,
					type,
					message,
					timestamp
				};
				return [entry, ...prev].slice(0, 50);
			});
		};

		const refreshAnalytics = () => {
			queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
			queryClient.invalidateQueries({ queryKey: ["analytics-zones"] });
			queryClient.invalidateQueries({ queryKey: ["analytics-timeline"] });
		};

		const onNeed = (payload) => {
			queryClient.invalidateQueries({ queryKey: ["needs"] });
			refreshAnalytics();
			if (payload?.deleted) {
				pushNotification(`Need ${payload.needId || "record"} removed`, "warning");
				return;
			}

			if (payload?.needId && payload?.status) {
				pushNotification(`Need ${payload.needId} updated to ${payload.status}`, "info");
				return;
			}

			if (payload?.needId && payload?.title) {
				pushNotification(`New need received: ${payload.title}`, "info");
			}
		};
		const onVolunteer = (payload) => {
			queryClient.invalidateQueries({ queryKey: ["volunteers"] });
			refreshAnalytics();
			if (payload?.volunteerId && payload?.availability) {
				pushNotification(`Volunteer ${payload.volunteerId} is now ${payload.availability}`, "info");
			}
		};
		const onMatch = (payload) => {
			queryClient.invalidateQueries({ queryKey: ["matches"] });
			queryClient.invalidateQueries({ queryKey: ["needs"] });
			queryClient.invalidateQueries({ queryKey: ["volunteers"] });
			refreshAnalytics();

			if (payload?.notification) {
				pushNotification(payload.notification.message, payload.notification.type, payload.notification.timestamp);
			} else if (Array.isArray(payload?.matches)) {
				pushNotification(`${payload.matches.length} new AI matches generated`, "info");
			}
		};
		const onAlert = (payload) => {
			queryClient.invalidateQueries({ queryKey: ["alerts"] });
			refreshAnalytics();
			if (payload?.notification) {
				pushNotification(payload.notification.message, payload.notification.type, payload.notification.timestamp);
			} else if (payload?.alert?.message) {
				pushNotification(payload.alert.message, "warning");
			}
		};
		const onAnalytics = refreshAnalytics;
		const onSystemHello = (payload) => {
			if (payload?.message) {
				pushNotification(payload.message, "success");
			}
		};

		socket.on("need:created", onNeed);
		socket.on("need:updated", onNeed);
		socket.on("volunteer:updated", onVolunteer);
		socket.on("match:generated", onMatch);
		socket.on("alert:new", onAlert);
		socket.on("analytics:update", onAnalytics);
		socket.on("system:hello", onSystemHello);

		return () => {
			socket.off("need:created", onNeed);
			socket.off("need:updated", onNeed);
			socket.off("volunteer:updated", onVolunteer);
			socket.off("match:generated", onMatch);
			socket.off("alert:new", onAlert);
			socket.off("analytics:update", onAnalytics);
			socket.off("system:hello", onSystemHello);
		};
	}, [queryClient]);

	const value = useMemo(
		() => ({
			notifications,
			setNotifications,
			clearNotifications: () => setNotifications([]),
			theme,
			setTheme,
			toggleTheme: () => setTheme((prev) => (prev === "light" ? "dark" : "light")),
			globalSearch,
			setGlobalSearch
		}),
		[notifications, theme, globalSearch]
	);

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error("useApp must be used inside AppProvider");
	}
	return context;
}
