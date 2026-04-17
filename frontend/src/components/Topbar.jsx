import { useLocation } from "react-router-dom";

const labels = {
  "/": "Saarthi Home",
  "/dashboard": "Operations Dashboard",
  "/needs": "Needs Queue",
  "/matching": "AI Matching Center",
  "/volunteers": "Volunteer Coordination",
  "/analytics": "Operational Analytics",
  "/alerts": "Alerts & Escalations",
  "/reports": "Reports & Compliance"
};

export default function Topbar() {
  const location = useLocation();
  const title = labels[location.pathname] || "Operations Dashboard";

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>Barmer District Control Room</p>
      </div>
      <span className="chip">
        <span className="status-dot" />
        Live monitoring enabled
      </span>
    </header>
  );
}