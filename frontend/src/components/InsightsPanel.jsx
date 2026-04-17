const SEVERITY_COLORS = {
  critical: "#ef4444",
  warning: "#f59e0b",
  success: "#00bfa5",
  info: "#3b82f6"
};

function Spinner() {
  return (
    <span
      style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: "2px solid #00bfa5",
        borderTopColor: "transparent",
        display: "inline-block",
        animation: "spin 0.8s linear infinite"
      }}
    />
  );
}

export default function InsightsPanel({ insights = [], loading = false, onRegenerate }) {
  return (
    <section
      className="panel"
      style={{
        marginBottom: 0,
        borderLeft: "4px solid #00BFA5"
      }}
    >
      <header className="panel-head" style={{ paddingBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2 className="section-title">AI Insights</h2>
          <span
            style={{
              border: "1px solid #00BFA5",
              color: "#00BFA5",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px"
            }}
          >
            Powered by Gemini
          </span>
        </div>
      </header>

      <div className="panel-body" style={{ paddingTop: 0 }}>
        {insights.map((insight, index) => (
          <div key={`${insight.title}-${index}`} style={{ padding: "12px 0", borderBottom: index === insights.length - 1 ? "none" : "1px solid #eef2f4" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: SEVERITY_COLORS[insight.severity] || SEVERITY_COLORS.info,
                  display: "inline-block"
                }}
              />
              <strong style={{ color: "#111827", fontSize: 14 }}>{insight.title}</strong>
            </div>
            <p style={{ margin: 0, color: "#4b5563", fontSize: 13, lineHeight: 1.45 }}>{insight.description}</p>
          </div>
        ))}

        <button
          className="soft-btn"
          onClick={onRegenerate}
          disabled={loading}
          style={{
            marginTop: 12,
            borderColor: "#00BFA5",
            color: "#00BFA5",
            display: "inline-flex",
            alignItems: "center",
            gap: 8
          }}
        >
          {loading ? <Spinner /> : null}
          {loading ? "Regenerating..." : "Regenerate AI Insights ↗"}
        </button>
      </div>
    </section>
  );
}
