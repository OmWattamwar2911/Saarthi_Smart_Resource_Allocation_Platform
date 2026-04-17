import { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { matchesApi } from "../services/api";

function parseEtaMinutes(eta) {
  const match = String(eta || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function deriveStats(rows) {
  const notifications = rows.filter((row) => String(row.status || "").toLowerCase() === "pending").length;
  const totalDispatch = rows.reduce((sum, row) => sum + parseEtaMinutes(row.eta), 0);
  const avgDispatchMin = rows.length ? Math.round(totalDispatch / rows.length) : 0;

  return {
    notifications,
    avgDispatchMin,
    liveMonitoring: true,
    totalOpen: rows.length,
    totalConfirmed: rows.filter((row) => String(row.status || "").toLowerCase() === "confirmed").length
  };
}

function getConfidenceColor(score) {
  const value = Number(score || 0);
  if (value >= 80) return "#16a34a";
  if (value >= 50) return "#d97706";
  return "#dc2626";
}

export default function AIMatching() {
  const [mode, setMode] = useState("Map Final Mission Control");
  const [inValue, setInValue] = useState("");
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({
    notifications: 0,
    avgDispatchMin: 0,
    liveMonitoring: true,
    totalOpen: 0,
    totalConfirmed: 0
  });
  const [loadingTable, setLoadingTable] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [busyMatchIds, setBusyMatchIds] = useState({});

  const fetchMatches = useCallback(async () => {
    setLoadingTable(true);
    setLoadingStats(true);
    try {
      const nextRows = await matchesApi.list();
      setRows(nextRows);
      setStats(deriveStats(nextRows));
    } catch (error) {
      const message = error?.response?.data?.error || "Failed to load AI matches";
      toast.error(message);
    } finally {
      setLoadingTable(false);
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  async function handleGenerateMatches() {
    setGenerating(true);
    try {
      const generated = await matchesApi.generate();
      await fetchMatches();
      toast.success(`${generated.length} matches generated successfully`);
    } catch (error) {
      const message = error?.response?.data?.error || "AI matching failed";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleConfirm(matchId) {
    const previous = rows;
    setBusyMatchIds((current) => ({ ...current, [matchId]: true }));
    setRows((current) => {
      const next = current.map((row) => (row.matchId === matchId ? { ...row, status: "Confirmed" } : row));
      setStats(deriveStats(next));
      return next;
    });

    try {
      await matchesApi.confirm(matchId);
      await fetchMatches();
      toast.success(`${matchId} confirmed`);
    } catch (error) {
      setRows(previous);
      setStats(deriveStats(previous));
      const message = error?.response?.data?.error || "Failed to confirm match";
      toast.error(message);
    } finally {
      setBusyMatchIds((current) => {
        const clone = { ...current };
        delete clone[matchId];
        return clone;
      });
    }
  }

  async function handleReject(matchId) {
    const previous = rows;
    setBusyMatchIds((current) => ({ ...current, [matchId]: true }));
    setRows((current) => {
      const next = current.map((row) => (row.matchId === matchId ? { ...row, status: "Rejected" } : row));
      setStats(deriveStats(next));
      return next;
    });

    try {
      await matchesApi.reject(matchId);
      await fetchMatches();
      toast.success(`${matchId} rejected`);
    } catch (error) {
      setRows(previous);
      setStats(deriveStats(previous));
      const message = error?.response?.data?.error || "Failed to reject match";
      toast.error(message);
    } finally {
      setBusyMatchIds((current) => {
        const clone = { ...current };
        delete clone[matchId];
        return clone;
      });
    }
  }

  return (
    <section className="page">
      <Toaster position="top-right" />
      <section className="panel">
        <header className="panel-head">
          <h2 className="section-title">AI Matching Center</h2>
          <p className="section-subtitle">Recommended teams ranked by route, skill and urgency</p>
        </header>

        <div className="panel-body">
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.8rem" }}>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              style={{ minWidth: 210, padding: "0.52rem", borderRadius: 12, border: "1px solid #cbd5e1" }}
            >
              <option>Map Final Mission Control</option>
            </select>
            <input
              type="text"
              value={inValue}
              onChange={(event) => setInValue(event.target.value)}
              placeholder="In"
              style={{ minWidth: 150, padding: "0.52rem", borderRadius: 12, border: "1px solid #cbd5e1" }}
            />
            <span style={{ fontWeight: 600 }}>Notifications: {loadingStats ? "..." : Number(stats.notifications || 0)}</span>
            <span style={{ color: "#0f766e", fontWeight: 600 }}>
              {stats.liveMonitoring === false ? "Live monitoring paused" : "Live monitoring enabled"}
            </span>
            <span style={{ marginLeft: "auto", fontWeight: 600 }}>
              Avg Dispatch: {loadingStats ? "..." : `${Number(stats.avgDispatchMin || 0)} min`}
            </span>
          </div>

          <button className="primary-btn" onClick={handleGenerateMatches} disabled={generating} style={{ marginBottom: "0.8rem", background: "#00BFA5" }}>
            {generating ? "Generating..." : "Generate AI Matches"}
          </button>

          <table className="table">
            <thead>
              <tr>
                <th>MATCH ID</th>
                <th>NEED</th>
                <th>SUGGESTED TEAM</th>
                <th>ETA</th>
                <th>CONFIDENCE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loadingTable ? (
                <tr>
                  <td colSpan="6">Loading...</td>
                </tr>
              ) : null}

              {!loadingTable && rows.length === 0 ? (
                <tr>
                  <td colSpan="6">No matches available</td>
                </tr>
              ) : null}

              {rows.map((match) => {
                const isBusy = Boolean(busyMatchIds[match.matchId]);

                return (
                  <tr key={match.matchId}>
                    <td>{match.matchId}</td>
                    <td>{match.needDescription || match.needId?.title || "-"}</td>
                    <td>{match.teamName || match.suggestedTeam || "-"}</td>
                    <td>{match.eta ? `${parseEtaMinutes(match.eta)} min` : "-"}</td>
                    <td style={{ color: getConfidenceColor(match.confidenceScore), fontWeight: 700 }}>
                      {Number(match.confidenceScore ?? match.confidence ?? 0)}%
                    </td>
                    <td>
                      {String(match.status || "").toLowerCase() === "confirmed" ? (
                        <span style={{ color: "#166534", fontWeight: 700 }}>Confirmed ✓</span>
                      ) : null}
                      {String(match.status || "").toLowerCase() === "rejected" ? <span style={{ color: "#b91c1c", fontWeight: 700 }}>Rejected</span> : null}
                      {String(match.status || "").toLowerCase() !== "confirmed" && String(match.status || "").toLowerCase() !== "rejected" ? (
                        <div className="actions">
                          <button className="primary-btn" onClick={() => handleConfirm(match.matchId)} disabled={isBusy}>
                            {isBusy ? "..." : "Confirm"}
                          </button>
                          <button className="danger-btn" onClick={() => handleReject(match.matchId)} disabled={isBusy}>
                            {isBusy ? "..." : "Reject"}
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
