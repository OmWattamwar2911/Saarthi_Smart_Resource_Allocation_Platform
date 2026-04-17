import { Link } from "react-router-dom";

const features = [
  {
    title: "Operations Dashboard",
    description:
      "Monitor district-level demand, response pace, and dispatch health in one command surface.",
    to: "/dashboard",
    cta: "Open Dashboard"
  },
  {
    title: "Needs Queue",
    description:
      "Track verified incidents by urgency, category, and location to prioritize response allocation.",
    to: "/needs",
    cta: "Review Needs"
  },
  {
    title: "AI Matching Center",
    description:
      "Use confidence-ranked recommendations to match volunteers and teams with high-impact incidents.",
    to: "/matching",
    cta: "View Matches"
  },
  {
    title: "Volunteer Coordination",
    description:
      "Manage skill availability, zone capacity, and assignment flow across active field volunteers.",
    to: "/volunteers",
    cta: "Manage Volunteers"
  },
  {
    title: "Operational Analytics",
    description:
      "Analyze response metrics, zone pressure trends, and service-level compliance for planning.",
    to: "/analytics",
    cta: "Explore Analytics"
  },
  {
    title: "Alerts & Escalations",
    description:
      "Escalate critical operational issues in real time with severity-first incident awareness.",
    to: "/alerts",
    cta: "Open Alerts"
  },
  {
    title: "Reports & Compliance",
    description:
      "Generate stakeholder-ready summaries for administration, NGOs, and donor reporting.",
    to: "/reports",
    cta: "Open Reports"
  }
];

export default function Home() {
  return (
    <section className="page page-signature">
      <section className="hero-home panel">
        <div>
          <p className="hero-kicker">Saarthi Command Platform</p>
          <h2 className="hero-title">Smart Resource Allocation for Disaster Response</h2>
          <p className="hero-copy">
            Coordinate needs, volunteers, AI matching, and district reporting through a single,
            operations-grade control experience.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="primary-btn" to="/dashboard">
            Go to Dashboard
          </Link>
          <Link className="soft-btn" to="/needs">
            Review Incoming Needs
          </Link>
        </div>
      </section>

      <div className="stat-grid">
        <article className="stat-card">
          <h3 style={{ color: "var(--critical)" }}>24/7</h3>
          <p>Live district monitoring</p>
        </article>
        <article className="stat-card">
          <h3 style={{ color: "var(--brand)" }}>AI-assisted</h3>
          <p>Volunteer-to-need matching</p>
        </article>
        <article className="stat-card">
          <h3 style={{ color: "var(--high)" }}>Multi-zone</h3>
          <p>Cross-district command visibility</p>
        </article>
        <article className="stat-card">
          <h3 style={{ color: "var(--low)" }}>Actionable</h3>
          <p>Escalations, reports, and audits</p>
        </article>
      </div>

      <section className="panel signature-panel">
        <header className="panel-head">
          <h2 className="section-title">Platform Features</h2>
          <p className="section-subtitle">
            Navigate quickly to each operational module from your command home.
          </p>
        </header>
        <div className="panel-body">
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <Link className="feature-link" to={feature.to}>
                  {feature.cta} →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}