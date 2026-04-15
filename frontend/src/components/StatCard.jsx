export default function StatCard({ title, value, color }) {
  return (
    <div style={{
      background: "#0f1824",
      padding: "20px",
      borderRadius: "12px",
      flex: 1
    }}>
      <h2 style={{ color }}>{value}</h2>
      <p style={{ color: "#6b7a94" }}>{title}</p>
    </div>
  );
}