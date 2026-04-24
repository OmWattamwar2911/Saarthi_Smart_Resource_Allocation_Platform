import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import StatCard from "../components/StatCard";
import NeedCard from "../components/NeedCard";
import Heatmap from "../components/Heatmap";
import SubmitModal from "../components/SubmitModal";
import AIStream from "../components/AIStream";
import VolunteerCard from "../components/VolunteerCard";
import { useNeeds, useCreateNeed } from "../hooks/useNeeds";
import { useVolunteers } from "../hooks/useVolunteers";
import { aiApi, alertsApi, analyticsApi, matchesApi, reportsApi } from "../services/api";

function formatTimeAgo(timestamp) {
  if (!timestamp) return "just now";
  const diffMs = Date.now() - new Date(timestamp).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return "just now";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function openBlobInNewTab(blob) {
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60000);
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: needs = [] } = useNeeds({ sort: "urgency", order: "desc", limit: 20 });
  const { data: volunteers = [] } = useVolunteers({});
  const { data: matches = [] } = useQuery({ queryKey: ["matches"], queryFn: () => matchesApi.list() });
  const { data: alerts = [] } = useQuery({ queryKey: ["alerts"], queryFn: () => alertsApi.list() });
  const { data: summary = {} } = useQuery({ queryKey: ["analytics-summary"], queryFn: analyticsApi.summary });
  const { data: zones = [] } = useQuery({ queryKey: ["analytics-zones"], queryFn: analyticsApi.zones });
  const { data: categories = [] } = useQuery({ queryKey: ["analytics-categories"], queryFn: analyticsApi.categories });
  const { data: timeline = [] } = useQuery({ queryKey: ["analytics-timeline"], queryFn: analyticsApi.timeline });

  const createNeed = useCreateNeed();
  const generateMatches = useMutation({
    mutationFn: () => matchesApi.generate(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matches"] })
  });
  const generateReport = useMutation({
    mutationFn: (payload) => reportsApi.generate(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] })
  });

  const liveReasoning = useMutation({
    mutationFn: (prompt) => aiApi.generate({
      prompt,
      systemPrompt:
        "You are a disaster relief AI coordinator. Return concise, operational reasoning in short lines suitable for a live dashboard stream."
    })
  });
  const [showModal, setShowModal] = useState(false);

  const addNeed = async (newNeed) => {
    try {
      await createNeed.mutateAsync(newNeed);
      setShowModal(false);
    } catch {
      // Keep modal open so operators can retry if auth/session has expired.
    }
  };

  const openNeedsCount = summary.openNeeds ?? needs.filter((need) => need.status !== "Resolved").length;
  const activeVolunteersCount =
    summary.activeVolunteers ??
    volunteers.filter((volunteer) => ["Available", "On Route", "Assigned"].includes(volunteer.availability)).length;
  const avgConfidence =
    summary.avgConfidence ??
    Math.round(
      matches.reduce((total, match) => total + Number(match.confidence || 0), 0) / (matches.length || 1)
    );
  const peopleHelped = summary.peopleHelped ?? 0;
  const volunteerHours = Math.round(
    volunteers.reduce((total, volunteer) => total + Number(volunteer.tasksCompleted || 0), 0) * 1.5
  );
  const districtsCovered = zones.filter((zone) => Number(zone.priorityScore || 0) > 0).length;

  const liveCategorySnapshot = categories.map((item) => ({
    label: item.category,
    value: item.count,
    color:
      item.category === "Medical"
        ? "var(--critical)"
        : item.category === "Food"
          ? "var(--high)"
          : item.category === "Shelter"
            ? "var(--brand)"
            : item.category === "Water"
              ? "#2f7bde"
              : "#dd8a33"
  }));

  const liveForecast = timeline.map((item) => ({ day: item.day, value: item.needCount }));

  const liveRecommendations = matches.slice(0, 3).map((match) => ({
    id: match.matchId,
    need: match.needId?.title || "Unmapped Need",
    confidence: Number(match.confidence || 0),
    volunteer: match.volunteerId?.name || "Unassigned",
    skill: match.volunteerId?.role || "General",
    distance: match.distanceKm ? `${match.distanceKm}km` : "-",
    eta: `${match.eta || 0} min`,
    reason: match.reason || "AI ranked this assignment by urgency, role fit, and zone proximity."
  }));

  const liveLeaderboard = useMemo(() => {
    return [...volunteers]
      .sort((a, b) => Number(b.tasksCompleted || 0) - Number(a.tasksCompleted || 0))
      .slice(0, 3)
      .map((volunteer, index) => ({
        rank: index + 1,
        name: volunteer.name,
        code: volunteer.avatar || volunteer.name?.slice(0, 2)?.toUpperCase() || "--",
        xp: Number(volunteer.xp || 0),
        tasks: Number(volunteer.tasksCompleted || 0),
        badge: index === 0 ? "Gold" : index === 1 ? "Silver" : "Bronze"
      }));
  }, [volunteers]);

  const liveAlerts = alerts.slice(0, 3).map((alert) => ({
    id: alert.alertId,
    level: alert.severity,
    message: alert.message,
    time: formatTimeAgo(alert.createdAt)
  }));

  const liveImpactMetrics = [
    { label: "Total needs resolved", value: String(summary.resolvedCount ?? 0) },
    { label: "People directly helped", value: String(peopleHelped) },
    { label: "Avg. response time", value: `${summary.avgResponseTime ?? 38} min` },
    { label: "Volunteer hours logged", value: `${volunteerHours} hrs` },
    { label: "AI match accuracy", value: `${avgConfidence || 0}%` },
    { label: "Districts covered", value: `${districtsCovered}` }
  ];

  const defaultStreamLines = [
    `> Tracking ${openNeedsCount} open needs across the district...`,
    `> Monitoring ${activeVolunteersCount} active volunteers...`,
    `> Evaluating ${matches.length} AI-suggested assignments...`,
    "> Live synchronization enabled via Socket.IO events."
  ];

  const [streamLines, setStreamLines] = useState(defaultStreamLines);

  const reportPeriod = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  async function handleRunLiveReasoning() {
    setStreamLines([
      "> Running AI operational analysis...",
      "> Refreshing match recommendations...",
      "> Preparing reasoning stream..."
    ]);

    try {
      await generateMatches.mutateAsync();
    } catch {
      // Continue reasoning generation even if protected match generation fails for current session.
    }

    try {
      const prompt = [
        `Open needs: ${openNeedsCount}`,
        `Active volunteers: ${activeVolunteersCount}`,
        `Average match confidence: ${avgConfidence || 0}%`,
        `Active alerts: ${alerts.filter((item) => item.status !== "Resolved").length}`,
        `Top recommendations: ${liveRecommendations
          .map((item) => `${item.need} -> ${item.volunteer} (${item.confidence}%)`)
          .join("; ") || "No current recommendations"}`,
        "Generate 4 short real-time reasoning lines with dispatch intent."
      ].join("\n");

      const response = await liveReasoning.mutateAsync(prompt);
      const lines = String(response?.text || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 6)
        .map((line) => (line.startsWith(">") ? line : `> ${line}`));

      setStreamLines(lines.length ? lines : defaultStreamLines);
    } catch {
      setStreamLines([
        "> AI reasoning service is temporarily unavailable.",
        "> Using latest operational telemetry from local analytics.",
        ...defaultStreamLines.slice(0, 2)
      ]);
    }
  }

  async function handleGenerateImpactReport() {
    try {
      const report = await generateReport.mutateAsync({
        type: "Impact",
        owner: "District Command",
        metrics: {
          openNeeds: openNeedsCount,
          activeVolunteers: activeVolunteersCount,
          avgConfidence,
          peopleHelped
        }
      });
      const blob = await reportsApi.openPdfBlob(report.reportId);
      openBlobInNewTab(blob);
    } catch {
      alert("Unable to generate impact report right now. Please check login/session and try again.");
    }
  }

  async function handleDownloadDonorReport() {
    try {
      const report = await generateReport.mutateAsync({
        type: "Donor",
        owner: "District Command",
        metrics: {
          openNeeds: openNeedsCount,
          activeVolunteers: activeVolunteersCount,
          resolvedNeeds: summary.resolvedCount ?? 0,
          peopleHelped
        }
      });
      const blob = await reportsApi.openPdfBlob(report.reportId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      alert("Unable to download donor report right now. Please check login/session and try again.");
    }
  }

  return (
    <section className="page page-signature dashboard-layout">
      <div className="stat-grid">
        <StatCard title="Open Needs" value={openNeedsCount} color="var(--critical)" />
        <StatCard title="Active Volunteers" value={activeVolunteersCount} color="var(--low)" />
        <StatCard title="AI Match Confidence" value={`${avgConfidence || 0}%`} color="var(--brand)" />
        <StatCard title="People Helped" value={peopleHelped} color="var(--high)" />
      </div>

      <div className="two-col">
        <Heatmap needs={needs} zones={zones} />

        <section className="panel">
          <header className="panel-head">
            <h2 className="section-title">Live Needs Feed</h2>
            <p className="section-subtitle">Prioritized by urgency and waiting time</p>
          </header>
          <div className="panel-body">
            <button className="primary-btn" onClick={() => setShowModal(true)}>
              + Submit Need
            </button>

            <div className="need-list" style={{ marginTop: "0.8rem" }}>
              {needs.length === 0 ? <p className="muted">No active needs found.</p> : null}
              {needs.map((need) => (
                <NeedCard key={need.needId || need._id || need.id} need={need} />
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="two-col">
        <section className="panel">
          <header className="panel-head">
            <h2 className="section-title">Gemini AI Matching</h2>
            <p className="section-subtitle">Confidence-ranked volunteer recommendations</p>
          </header>
          <div className="panel-body">
            <div className="match-list">
              {liveRecommendations.length === 0 ? (
                <p className="muted">No AI matches generated yet.</p>
              ) : null}
              {liveRecommendations.map((match, index) => (
                <article className="match-card" key={match.id || `${match.need}-${index}`}>
                  <div className="match-top">
                    <p className="need-title">{match.need}</p>
                    <span className="match-score">{match.confidence}%</span>
                  </div>
                  <div className="match-bar">
                    <span style={{ width: `${match.confidence}%` }} />
                  </div>
                  <p className="need-meta">
                    {match.volunteer} · {match.skill} · {match.distance} · ETA {match.eta}
                  </p>
                  <p className="match-reason">{match.reason}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <header className="panel-head">
            <h2 className="section-title">Category Snapshot</h2>
            <p className="section-subtitle">Need distribution and 7-day forecast</p>
          </header>

          <div className="panel-body">
            <div className="category-bars">
              {liveCategorySnapshot.length === 0 ? <p className="muted">No category data available.</p> : null}
              {liveCategorySnapshot.map((item, index) => (
                <div className="category-row" key={`${item.label}-${index}`}>
                  <span className="muted">{item.label}</span>
                  <div className="category-track">
                    <span style={{ width: `${item.value * 5}%`, background: item.color }} />
                  </div>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="forecast-grid">
              {liveForecast.length === 0 ? <p className="muted">No weekly trend data available.</p> : null}
              {liveForecast.map((day, index) => (
                <article className="forecast-day" key={`${day.day}-${index}`}>
                  <span className="muted">{day.day}</span>
                  <strong>{day.value}</strong>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="three-col">
        <AIStream
          lines={streamLines}
          onRunAnalysis={handleRunLiveReasoning}
          onGenerateReport={handleGenerateImpactReport}
          isRunning={generateMatches.isPending || liveReasoning.isPending}
          isGeneratingReport={generateReport.isPending}
        />

        <section className="panel">
          <header className="panel-head">
            <h2 className="section-title">Volunteer Leaderboard</h2>
            <p className="section-subtitle">Top responders by impact score</p>
          </header>
          <div className="panel-body leaderboard-list">
            {liveLeaderboard.length === 0 ? <p className="muted">No volunteer leaderboard data.</p> : null}
            {liveLeaderboard.map((item, index) => (
              <VolunteerCard key={`${item.name}-${item.rank || index}`} item={item} />
            ))}
          </div>
        </section>

        <section className="panel">
          <header className="panel-head">
            <h2 className="section-title">System Alerts</h2>
            <p className="section-subtitle">Active escalations and notices</p>
          </header>
          <div className="panel-body alert-list">
            {liveAlerts.length === 0 ? <p className="muted">No active alerts.</p> : null}
            {liveAlerts.map((alert, index) => (
              <article className="alert-row" key={alert.id || `${alert.level}-${index}`}>
                <div>
                  <p className="need-title">{alert.level}</p>
                  <p className="need-meta">{alert.message}</p>
                </div>
                <span className="muted">{alert.time}</span>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <header className="panel-head">
          <h2 className="section-title">Impact Report · {reportPeriod}</h2>
          <p className="section-subtitle">AI-generated district impact summary</p>
        </header>

        <div className="panel-body">
          <div className="impact-grid">
            {liveImpactMetrics.map((metric) => (
              <article className="impact-card" key={metric.label}>
                <p className="muted">{metric.label}</p>
                <h3>{metric.value}</h3>
              </article>
            ))}
          </div>

          <p className="impact-copy">
            Saarthi is currently tracking {openNeedsCount} open needs with {activeVolunteersCount} active volunteers.
            Live analytics reports an average response time of {summary.avgResponseTime ?? 38} minutes and
            AI match confidence near {avgConfidence || 0}%, helping reduce dispatch delays across monitored zones.
          </p>

          <div className="actions">
            <button className="soft-btn" onClick={handleGenerateImpactReport}>
              Generate PDF
            </button>
            <button className="primary-btn" onClick={handleDownloadDonorReport}>
              Download Donor Report
            </button>
          </div>
        </div>
      </section>

      {showModal && (
        <SubmitModal
          onClose={() => setShowModal(false)}
          onSubmit={addNeed}
        />
      )}
    </section>
  );
}