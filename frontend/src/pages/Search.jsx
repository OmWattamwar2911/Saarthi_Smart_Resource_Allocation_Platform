import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { alertsApi, needsApi, reportsApi, volunteersApi } from "../services/api";
import { useApp } from "../context/AppContext";

export default function Search() {
  const { globalSearch, setGlobalSearch } = useApp();

  const needsQuery = useQuery({ queryKey: ["search-needs", globalSearch], queryFn: () => needsApi.list({ search: globalSearch }), enabled: globalSearch.length > 1 });
  const volunteerQuery = useQuery({ queryKey: ["search-volunteers", globalSearch], queryFn: () => volunteersApi.list({ search: globalSearch }), enabled: globalSearch.length > 1 });
  const alertsQuery = useQuery({ queryKey: ["search-alerts"], queryFn: () => alertsApi.list(), enabled: globalSearch.length > 1 });
  const reportsQuery = useQuery({ queryKey: ["search-reports"], queryFn: () => reportsApi.list(), enabled: globalSearch.length > 1 });

  const filteredAlerts = useMemo(
    () => (alertsQuery.data || []).filter((item) => item.message.toLowerCase().includes(globalSearch.toLowerCase())),
    [alertsQuery.data, globalSearch]
  );
  const filteredReports = useMemo(
    () => (reportsQuery.data || []).filter((item) => item.title.toLowerCase().includes(globalSearch.toLowerCase())),
    [reportsQuery.data, globalSearch]
  );

  return (
    <section className="page">
      <section className="panel">
        <header className="panel-head">
          <h2 className="section-title">Global Search</h2>
          <p className="section-subtitle">Search across needs, volunteers, alerts and reports.</p>
        </header>
        <div className="panel-body">
          <input className="input" placeholder="Search keyword..." value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} />
          {globalSearch.length < 2 ? (
            <p className="muted">Enter at least 2 characters.</p>
          ) : (
            <div className="two-col" style={{ marginTop: "0.9rem" }}>
              <div className="panel">
                <div className="panel-body">
                  <h3>Needs ({needsQuery.data?.length || 0})</h3>
                  {(needsQuery.data || []).map((item) => <p key={item.needId} className="need-meta">{item.needId} - {item.title}</p>)}
                  <h3>Volunteers ({volunteerQuery.data?.length || 0})</h3>
                  {(volunteerQuery.data || []).map((item) => <p key={item.volunteerId} className="need-meta">{item.volunteerId} - {item.name}</p>)}
                </div>
              </div>
              <div className="panel">
                <div className="panel-body">
                  <h3>Alerts ({filteredAlerts.length})</h3>
                  {filteredAlerts.map((item) => <p key={item.alertId} className="need-meta">{item.alertId} - {item.message}</p>)}
                  <h3>Reports ({filteredReports.length})</h3>
                  {filteredReports.map((item) => <p key={item.reportId} className="need-meta">{item.reportId} - {item.title}</p>)}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
