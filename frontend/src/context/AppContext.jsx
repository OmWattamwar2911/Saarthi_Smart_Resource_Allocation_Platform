import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../services/socket";

const AppContext = createContext(null);

export function AppProvider({ children }) {
	const queryClient = useQueryClient();
	const [notifications, setNotifications] = useState([]);
	const [theme, setTheme] = useState(() => localStorage.getItem("saarthi_theme") || "light");
	const [globalSearch, setGlobalSearch] = useState("");

	useEffect(() => {
		document.documentElement.dataset.theme = theme;
		localStorage.setItem("saarthi_theme", theme);
	}, [theme]);

	useEffect(() => {
		const socket = getSocket();

		const onNeed = () => queryClient.invalidateQueries({ queryKey: ["needs"] });
		const onVolunteer = () => queryClient.invalidateQueries({ queryKey: ["volunteers"] });
		const onMatch = () => {
			queryClient.invalidateQueries({ queryKey: ["matches"] });
			queryClient.invalidateQueries({ queryKey: ["needs"] });
			queryClient.invalidateQueries({ queryKey: ["volunteers"] });
		};
		const onAlert = (payload) => {
			queryClient.invalidateQueries({ queryKey: ["alerts"] });
			if (payload?.notification) {
				setNotifications((prev) => [payload.notification, ...prev].slice(0, 50));
			}
		};

		socket.on("need:created", onNeed);
		socket.on("need:updated", onNeed);
		socket.on("volunteer:updated", onVolunteer);
		socket.on("match:generated", onMatch);
		socket.on("alert:new", onAlert);

		return () => {
			socket.off("need:created", onNeed);
			socket.off("need:updated", onNeed);
			socket.off("volunteer:updated", onVolunteer);
			socket.off("match:generated", onMatch);
			socket.off("alert:new", onAlert);
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
