import { useApp } from "../context/AppContext";

export default function Notifications() {
  const { notifications, clearNotifications } = useApp();

  return (
    <section className="page">
      <section className="panel">
        <header className="panel-head">
          <h2 className="section-title">Live Notifications</h2>
          <p className="section-subtitle">Socket-driven operational updates.</p>
        </header>
        <div className="panel-body">
          <div className="actions" style={{ marginBottom: "0.8rem" }}>
            <button className="soft-btn" onClick={clearNotifications}>Clear</button>
          </div>
          <div className="need-list">
            {notifications.length === 0 ? (
              <p className="muted">No notifications yet.</p>
            ) : (
              notifications.map((item) => (
                <article key={item.id} className="need-card" style={{ gridTemplateColumns: "1fr auto" }}>
                  <div>
                    <p className="need-title">{item.message}</p>
                    <p className="need-meta">{item.type}</p>
                  </div>
                  <span className="muted">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
