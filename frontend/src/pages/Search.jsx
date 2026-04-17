import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { alertsApi, needsApi, reportsApi, volunteersApi } from "../services/api";
import { useApp } from "../context/AppContext";

const SCOPES = ["all", "needs", "volunteers", "alerts", "reports"];

function useDebouncedValue(value, delayMs = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}

function highlightMatch(text, keyword) {
  const source = String(text || "");
  const query = String(keyword || "").trim();
  if (!query) return source;

  const index = source.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return source;

  return (
    <>
      {source.slice(0, index)}
      <mark>{source.slice(index, index + query.length)}</mark>
      {source.slice(index + query.length)}
    </>
  );
}

export default function Search() {
  const navigate = useNavigate();
  const { globalSearch, setGlobalSearch } = useApp();
  const [scope, setScope] = useState("all");
  const debouncedSearch = useDebouncedValue(globalSearch, 300);
  const enabled = debouncedSearch.length > 1;

  const needsQuery = useQuery({
    queryKey: ["search-needs", debouncedSearch],
    queryFn: () => needsApi.list({ search: debouncedSearch, limit: 10 }),
    enabled
  });
  const volunteerQuery = useQuery({
    queryKey: ["search-volunteers", debouncedSearch],
    queryFn: () => volunteersApi.list({ search: debouncedSearch, limit: 10 }),
    enabled
  });
  const alertsQuery = useQuery({
    queryKey: ["search-alerts", debouncedSearch],
    queryFn: () => alertsApi.list({ search: debouncedSearch, limit: 10 }),
    enabled
  });
  const reportsQuery = useQuery({
    queryKey: ["search-reports", debouncedSearch],
    queryFn: () => reportsApi.list({ search: debouncedSearch, limit: 10 }),
    enabled
  });

  const filteredAlerts = alertsQuery.data || [];
  const filteredReports = reportsQuery.data || [];

  const totalHits =
    (needsQuery.data?.length || 0) +
    (volunteerQuery.data?.length || 0) +
    filteredAlerts.length +
    filteredReports.length;

  const loading = needsQuery.isFetching || volunteerQuery.isFetching || alertsQuery.isFetching || reportsQuery.isFetching;

  return (
    <section className="page">
      <section className="panel">
        <header className="panel-head">
          <h2 className="section-title">Global Search</h2>
          <p className="section-subtitle">Search across needs, volunteers, alerts and reports.</p>
        </header>
        <div className="panel-body">
          <div className="two-col" style={{ gap: "0.55rem", marginBottom: "0.75rem" }}>
            <input
              className="input"
              placeholder="Search keyword..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
            <select className="input" value={scope} onChange={(event) => setScope(event.target.value)}>
              {SCOPES.map((item) => (
                <option key={item} value={item}>{item.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {globalSearch.length < 2 ? (
            <p className="muted">Enter at least 2 characters.</p>
          ) : (
            <>
              <p className="need-meta" style={{ marginBottom: "0.7rem" }}>
                {loading ? "Searching..." : `${totalHits} results found`} for "{debouncedSearch}".
              </p>

              <div className="two-col" style={{ marginTop: "0.5rem" }}>
                {(scope === "all" || scope === "needs") ? <div className="panel">
                <div className="panel-body">
                  <h3>Needs ({needsQuery.data?.length || 0})</h3>
                  {(needsQuery.data || []).map((item) => (
                    <article key={item.needId} className="need-card" style={{ gridTemplateColumns: "1fr auto", marginBottom: "0.4rem" }}>
                      <div>
                        <p className="need-title">{highlightMatch(`${item.needId} - ${item.title}`, debouncedSearch)}</p>
                        <p className="need-meta">{item.zone} · {item.category} · {item.status}</p>
                      </div>
                      <button className="soft-btn" onClick={() => navigate("/needs")}>Open</button>
                    </article>
                  ))}
                </div>
                </div> : null}

                {(scope === "all" || scope === "volunteers") ? <div className="panel">
                <div className="panel-body">
                  <h3>Volunteers ({volunteerQuery.data?.length || 0})</h3>
                  {(volunteerQuery.data || []).map((item) => (
                    <article key={item.volunteerId} className="need-card" style={{ gridTemplateColumns: "1fr auto", marginBottom: "0.4rem" }}>
                      <div>
                        <p className="need-title">{highlightMatch(`${item.volunteerId} - ${item.name}`, debouncedSearch)}</p>
                        <p className="need-meta">{item.role} · {item.zone} · {item.availability}</p>
                      </div>
                      <button className="soft-btn" onClick={() => navigate("/volunteers")}>Open</button>
                    </article>
                  ))}
                </div>
                </div> : null}
              </div>

              <div className="two-col" style={{ marginTop: "0.9rem" }}>
                {(scope === "all" || scope === "alerts") ? <div className="panel">
                  <div className="panel-body">
                    <h3>Alerts ({filteredAlerts.length})</h3>
                    {filteredAlerts.map((item) => (
                      <article key={item.alertId} className="need-card" style={{ gridTemplateColumns: "1fr auto", marginBottom: "0.4rem" }}>
                        <div>
                          <p className="need-title">{highlightMatch(`${item.alertId} - ${item.message}`, debouncedSearch)}</p>
                          <p className="need-meta">{item.zone} · {item.severity} · {item.status}</p>
                        </div>
                        <button className="soft-btn" onClick={() => navigate("/alerts")}>Open</button>
                      </article>
                    ))}
                  </div>
                </div> : null}

                {(scope === "all" || scope === "reports") ? <div className="panel">
                  <div className="panel-body">
                    <h3>Reports ({filteredReports.length})</h3>
                    {filteredReports.map((item) => (
                      <article key={item.reportId} className="need-card" style={{ gridTemplateColumns: "1fr auto", marginBottom: "0.4rem" }}>
                        <div>
                          <p className="need-title">{highlightMatch(`${item.reportId} - ${item.title}`, debouncedSearch)}</p>
                          <p className="need-meta">{item.owner} · {item.type || "Report"}</p>
                        </div>
                        <button className="soft-btn" onClick={() => navigate("/reports")}>Open</button>
                      </article>
                    ))}
                  </div>
                </div> : null}
              </div>
            </>
          )}
        </div>
      </section>
    </section>
  );
}
