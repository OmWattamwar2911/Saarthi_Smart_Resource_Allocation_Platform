import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/needs", label: "Needs" },
  { to: "/ai-matching", label: "AI Matching" },
  { to: "/volunteers", label: "Volunteers" },
  { to: "/analytics", label: "Analytics" },
  { to: "/alerts", label: "Alerts" },
  { to: "/reports", label: "Reports" },
  { to: "/notifications", label: "Notifications" },
  { to: "/search", label: "Global Search" },
  { to: "/history", label: "History" },
  { to: "/settings", label: "Settings" }
];

export default function Sidebar() {
  const { logout } = useAuth();
  return (
    <aside className="sidebar">
      <div className="brand">
        <h2 className="brand-title">Saarthi</h2>
        <p className="brand-sub">Smart Resource Allocation Platform</p>
      </div>

      <nav className="nav-list" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `nav-item${isActive ? " active" : ""}`
            }
          >
            <span>{item.label}</span>
            <span aria-hidden="true">›</span>
          </NavLink>
        ))}
      </nav>

      <div className="brand" style={{ marginTop: "auto" }}>
        <p className="brand-sub">Coverage</p>
        <p style={{ margin: "0.25rem 0 0", fontWeight: 600 }}>7 Active Zones</p>
        <button className="soft-btn" style={{ marginTop: "0.8rem", width: "100%" }} onClick={logout}>Logout</button>
      </div>
    </aside>
  );
}