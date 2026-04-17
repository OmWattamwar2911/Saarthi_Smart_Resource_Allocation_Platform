export default function NeedCard({ need }) {
  const colors = {
    5: "var(--critical)",
    4: "var(--high)",
    3: "var(--medium)",
    2: "var(--low)",
    1: "var(--low)"
  };

  return (
    <article className="need-card">
      <div className="need-priority" style={{ background: colors[need.urgency] }}>
        {need.urgency}
      </div>

      <div>
        <p className="need-title">{need.title}</p>
        <p className="need-meta">
          {need.category} · {need.location} · {need.time}
        </p>
      </div>

      <span className="tag">{need.status || "Open"}</span>
    </article>
  );
}