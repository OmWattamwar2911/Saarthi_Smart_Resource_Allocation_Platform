export default function StatCard({ title, value, color }) {
  return (
    <article className="stat-card">
      <h3 style={{ color }}>{value}</h3>
      <p>{title}</p>
    </article>
  );
}