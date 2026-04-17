import { useState } from "react";
import StatCard from "../components/StatCard";
import NeedCard from "../components/NeedCard";
import Heatmap from "../components/Heatmap";
import SubmitModal from "../components/SubmitModal";
import AIStream from "../components/AIStream";
import VolunteerCard from "../components/VolunteerCard";
import {
  initialNeeds,
  aiRecommendations,
  categorySnapshot,
  weeklyForecast,
  leaderboard,
  aiStreamLines,
  alertFeed,
  impactMetrics
} from "../data/mockData";

export default function Dashboard() {
  const [needs, setNeeds] = useState(initialNeeds);
  const [showModal, setShowModal] = useState(false);

  const addNeed = (newNeed) => {
    setNeeds([newNeed, ...needs]);
  };

  return (
    <section className="page page-signature dashboard-layout">
      <div className="stat-grid">
        <StatCard title="Open Needs" value={needs.length} color="var(--critical)" />
        <StatCard title="Active Volunteers" value="18" color="var(--low)" />
        <StatCard title="AI Match Confidence" value="94%" color="var(--brand)" />
        <StatCard title="People Helped" value="1,240" color="var(--high)" />
      </div>

      <div className="two-col">
        <Heatmap />

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
              {needs.map((n) => (
                <NeedCard key={n.id} need={n} />
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
              {aiRecommendations.map((match) => (
                <article className="match-card" key={match.id}>
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
              {categorySnapshot.map((item) => (
                <div className="category-row" key={item.label}>
                  <span className="muted">{item.label}</span>
                  <div className="category-track">
                    <span style={{ width: `${item.value * 5}%`, background: item.color }} />
                  </div>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="forecast-grid">
              {weeklyForecast.map((day) => (
                <article className="forecast-day" key={day.day}>
                  <span className="muted">{day.day}</span>
                  <strong>{day.value}</strong>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="three-col">
        <AIStream lines={aiStreamLines} />

        <section className="panel">
          <header className="panel-head">
            <h2 className="section-title">Volunteer Leaderboard</h2>
            <p className="section-subtitle">Top responders by impact score</p>
          </header>
          <div className="panel-body leaderboard-list">
            {leaderboard.map((item) => (
              <VolunteerCard key={item.rank} item={item} />
            ))}
          </div>
        </section>

        <section className="panel">
          <header className="panel-head">
            <h2 className="section-title">System Alerts</h2>
            <p className="section-subtitle">Active escalations and notices</p>
          </header>
          <div className="panel-body alert-list">
            {alertFeed.map((alert) => (
              <article className="alert-row" key={alert.id}>
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
          <h2 className="section-title">Impact Report · October 2024</h2>
          <p className="section-subtitle">AI-generated district impact summary</p>
        </header>

        <div className="panel-body">
          <div className="impact-grid">
            {impactMetrics.map((metric) => (
              <article className="impact-card" key={metric.label}>
                <p className="muted">{metric.label}</p>
                <h3>{metric.value}</h3>
              </article>
            ))}
          </div>

          <p className="impact-copy">
            In October 2024, Saarthi coordinated 184 crisis interventions across Barmer district
            following severe flooding. AI-assisted matching reduced average volunteer dispatch
            time from 3.2 hours to 38 minutes while improving category-specific assignment
            accuracy and reducing escalation backlog.
          </p>

          <div className="actions">
            <button className="soft-btn">Generate PDF</button>
            <button className="primary-btn">Download Donor Report</button>
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