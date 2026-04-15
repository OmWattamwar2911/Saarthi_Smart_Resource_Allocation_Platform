import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div style={{
      width: "220px",
      background: "#0d1420",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      padding: "20px"
    }}>
      <h2 style={{ color: "#22d3a0" }}>⬡ Saarthi</h2>

      <nav style={{ marginTop: "20px" }}>
        <Link to="/" style={linkStyle}>Dashboard</Link>
        <Link to="/" style={linkStyle}>Needs</Link>
        <Link to="/" style={linkStyle}>AI Matching</Link>
        <Link to="/" style={linkStyle}>Volunteers</Link>
      </nav>
    </div>
  );
}

const linkStyle = {
  display: "block",
  margin: "10px 0",
  color: "#6b7a94",
  textDecoration: "none"
};