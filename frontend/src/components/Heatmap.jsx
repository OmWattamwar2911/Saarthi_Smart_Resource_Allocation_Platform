const ZONE_POSITIONS = {
  "barmer central": { top: "26%", left: "46%" },
  "barmer east": { top: "30%", left: "62%" },
  siwana: { top: "35%", left: "68%" },
  balotra: { top: "16%", left: "18%" },
  gudamalani: { top: "58%", left: "24%" },
  "dhorimanna": { top: "58%", left: "24%" },
  "dhrimanna": { top: "58%", left: "24%" },
  pachpadra: { top: "66%", left: "58%" }
};

function normalizeZoneName(zone = "") {
  const normalized = String(zone).trim().toLowerCase();
  if (normalized === "dhorimanna") return "dhrimanna";
  return normalized;
}

function toDisplayZone(zone = "") {
  const normalized = normalizeZoneName(zone);
  if (normalized === "dhrimanna") return "Dhrimanna";
  return zone || "Unknown";
}

function getZonePosition(zone, index) {
  const direct = ZONE_POSITIONS[normalizeZoneName(zone)];
  if (direct) return direct;

  // Deterministic fallback for newly added zones without map coordinates yet.
  const fallback = [
    { top: "22%", left: "38%" },
    { top: "32%", left: "54%" },
    { top: "46%", left: "36%" },
    { top: "58%", left: "52%" },
    { top: "70%", left: "42%" }
  ];
  return fallback[index % fallback.length];
}

function urgencyToLevel(urgency) {
  if (urgency >= 5) return "critical";
  if (urgency >= 4) return "high";
  if (urgency >= 3) return "medium";
  return "low";
}

function buildMapLabels(zonesToRender, needs) {
  const zoneNames = new Set();

  zonesToRender.forEach((zone) => zoneNames.add(zone.name));
  needs.forEach((need) => {
    if (need.zone) zoneNames.add(need.zone);
  });

  return [...zoneNames].slice(0, 8).map((zoneName, index) => {
    const position = getZonePosition(zoneName, index);
    return {
      name: toDisplayZone(zoneName),
      top: position.top,
      left: position.left
    };
  });
}

function buildNeedPins(needs) {
  const activeNeeds = needs.filter((need) => !["Resolved", "Closed"].includes(need.status));

  return activeNeeds.slice(0, 10).map((need, index) => {
    const position = getZonePosition(need.zone, index);
    const topBase = Number.parseInt(position.top, 10);
    const leftBase = Number.parseInt(position.left, 10);
    const offset = (index % 3) * 2;

    return {
      id: need.needId || need._id || `pin-${index}`,
      level: urgencyToLevel(Number(need.urgency || 1)),
      title: `${need.title || "Need"} (${toDisplayZone(need.zone)})`,
      top: `${Math.min(82, topBase + offset)}%`,
      left: `${Math.min(84, leftBase + (index % 2 ? 2 : -2))}%`
    };
  });
}

function zoneBg(score) {
  if (score > 75) return "rgba(214, 69, 69, 0.12)";
  if (score > 60) return "rgba(235, 125, 45, 0.12)";
  if (score > 45) return "rgba(214, 166, 27, 0.12)";
  return "rgba(35, 164, 106, 0.12)";
}

export default function Heatmap({ needs = [], zones = [] }) {
  const activeNeeds = needs.filter((need) => !["Resolved", "Closed"].includes(need.status));
  const activeNeedsCount = activeNeeds.length;
  const zoneNeeds = needs.reduce((acc, need) => {
    const zoneName = need.zone || "Unknown Zone";
    acc[zoneName] = (acc[zoneName] || 0) + 1;
    return acc;
  }, {});

  const zonesToRender = (Array.isArray(zones) && zones.length
    ? zones
    : Object.entries(zoneNeeds).map(([zoneName, count]) => ({
        zone: zoneName,
        priorityScore: Math.min(99, count * 12),
        change: "+0%"
      }))
  ).map((zone) => ({
    name: zone.zone,
    score: Number(zone.priorityScore || 0),
    trend: zone.trend || zone.change || "+0%"
  }));
  const mapLabels = buildMapLabels(zonesToRender, needs);
  const mapPins = buildNeedPins(needs);

  return (
    <section className="panel">
      <header className="panel-head">
        <h2 className="section-title">Demand Heatmap</h2>
        <p className="section-subtitle">Live map view with urgency markers and zone trend scores</p>
      </header>

      <div className="panel-body">
        <div className="map-canvas" role="img" aria-label="Barmer district live need map">
          <div className="map-grid-lines" />
          <div className="map-glow-zone" />

          {mapLabels.map((label) => (
            <span
              key={label.name}
              className="map-district-label"
              style={{ top: label.top, left: label.left }}
            >
              {label.name}
            </span>
          ))}

          {mapPins.map((pin) => (
            <button
              key={pin.id}
              className={`map-need-pin ${pin.level}`}
              style={{ top: pin.top, left: pin.left }}
              title={pin.title}
              aria-label={pin.title}
              type="button"
            />
          ))}

          <div className="map-legend-box">
            <span>
              <i className="legend-dot critical" /> Critical
            </span>
            <span>
              <i className="legend-dot high" /> High
            </span>
            <span>
              <i className="legend-dot medium" /> Medium
            </span>
            <span>
              <i className="legend-dot low" /> Low
            </span>
          </div>

          <div className="map-stat-chip">
            <strong>{activeNeedsCount}</strong>
            <span>Active needs</span>
          </div>
        </div>

        <div className="heatmap-grid">
          {zonesToRender.length === 0 ? <p className="muted">No zone data available.</p> : null}
          {zonesToRender.map((zone) => (
            <article
              className="heat-cell"
              key={zone.name}
              style={{ background: zoneBg(zone.score) }}
            >
              <span className="muted">{zone.name}</span>
              <strong>{zone.score}</strong>
              <span className="muted">{zone.trend}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}