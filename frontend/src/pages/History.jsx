import { useQuery } from "@tanstack/react-query";
import { activityApi } from "../services/api";

export default function History() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["activity"],
    queryFn: () => activityApi.list({ limit: 100 })
  });

  return (
    <section className="page">
      <section className="panel">
        <header className="panel-head">
          <h2 className="section-title">Audit Log History</h2>
          <p className="section-subtitle">System activity timeline.</p>
        </header>
        <div className="panel-body">
          {isLoading ? <p className="muted">Loading logs...</p> : null}
          <div className="need-list">
            {data.map((log) => (
              <article key={log._id} className="need-card" style={{ gridTemplateColumns: "1fr auto" }}>
                <div>
                  <p className="need-title">{log.action}</p>
                  <p className="need-meta">{log.details}</p>
                </div>
                <span className="muted">{new Date(log.timestamp).toLocaleString()}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
