import { useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";

const labels = {
  "/": "Saarthi Home",
  "/dashboard": "Operations Dashboard",
  "/needs": "Needs Queue",
  "/ai-matching": "AI Matching Center",
  "/volunteers": "Volunteer Coordination",
  "/analytics": "Operational Analytics",
  "/alerts": "Alerts & Escalations",
  "/reports": "Reports & Compliance",
  "/notifications": "Live Notifications",
  "/search": "Global Search",
  "/history": "Activity History",
  "/settings": "System Settings"
};

export default function Topbar({ uiMode, onModeChange }) {
  const location = useLocation();
  const { notifications, globalSearch, setGlobalSearch } = useApp();
  const title = labels[location.pathname] || "Operations Dashboard";

  return (
    <header className="topbar">
      <div className="topbar-title">
        <p className="topbar-eyebrow">District Resilience Network</p>
        <h1>{title}</h1>
        <p>Barmer District Control Room</p>
      </div>
      <div className="topbar-right">
        <label className="mode-select-wrap" htmlFor="ui-mode">
          <span>Mode</span>
          <select
            id="ui-mode"
            className="mode-select"
            value={uiMode}
            onChange={(e) => onModeChange(e.target.value)}
          >
            <option value="brutalist">Brutalist Editorial</option>
            <option value="glass">Glass Command-Center</option>
            <option value="map">Map-first Mission Control</option>
          </select>
        </label>
        <input
          className="input"
          style={{ width: 220 }}
          placeholder="Quick search"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
        />
        <span className="chip">Notifications: {notifications.length}</span>
        <span className="chip">
          <span className="status-dot" />
          Live monitoring enabled
        </span>
        <span className="chip chip-soft">Avg dispatch 38 min</span>
      </div>
    </header>
  );
}