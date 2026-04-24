import { useMemo, useState } from "react";

const ZONE_POSITIONS = {
  "barmer central": { top: "26%", left: "46%" },
  "barmer east": { top: "30%", left: "62%" },
  siwana: { top: "35%", left: "68%" },
  balotra: { top: "16%", left: "18%" },
  gudamalani: { top: "60%", left: "16%" },
  "dhorimanna": { top: "58%", left: "28%" },
  "dhrimanna": { top: "58%", left: "28%" },
  pachpadra: { top: "66%", left: "58%" }
};

function normalizeZoneName(zone = "") {
  const normalized = String(zone).trim().toLowerCase();
  if (normalized === "dhrimanna") return "dhorimanna";
  return normalized;
}

function toDisplayZone(zone = "") {
  const normalized = normalizeZoneName(zone);
  if (normalized === "dhorimanna") return "Dhorimanna";
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
  const zoneOffsets = {};

  return activeNeeds.slice(0, 18).map((need, index) => {
    const position = getZonePosition(need.zone, index);
    const zoneKey = normalizeZoneName(need.zone || "");
    zoneOffsets[zoneKey] = (zoneOffsets[zoneKey] || 0) + 1;

    const zoneIndex = zoneOffsets[zoneKey] - 1;
    const ringIndex = zoneIndex % 6;
    const ring = Math.floor(zoneIndex / 6) + 1;
    const angle = (Math.PI * 2 * ringIndex) / 6;
    const dx = Math.round(Math.cos(angle) * ring * 2.2);
    const dy = Math.round(Math.sin(angle) * ring * 2.2);

    const topBase = Number.parseInt(position.top, 10);
    const leftBase = Number.parseInt(position.left, 10);

    return {
      id: need.needId || need._id || `pin-${index}`,
      level: urgencyToLevel(Number(need.urgency || 1)),
      title: `${need.title || "Need"} (${toDisplayZone(need.zone)})`,
      top: `${Math.min(84, Math.max(12, topBase + dy))}%`,
      left: `${Math.min(86, Math.max(10, leftBase + dx))}%`,
      zoneName: toDisplayZone(need.zone),
      status: need.status || "Open",
      category: need.category || "Logistics",
      urgency: Number(need.urgency || 1)
    };
  });
}

function zoneBg(score) {
  if (score > 75) return "rgba(214, 69, 69, 0.12)";
  if (score > 60) return "rgba(235, 125, 45, 0.12)";
  if (score > 45) return "rgba(214, 166, 27, 0.12)";
  return "rgba(35, 164, 106, 0.12)";
}

function toMetricValue(zone, metric) {
  if (metric === "open") return Number(zone.openNeeds || 0);
  if (metric === "dispatch") return Number(zone.avgDispatchMin || 0);
  return Number(zone.score || 0);
}

function zoneNodeClass(value, metric) {
  if (metric === "dispatch") {
    if (value > 30) return "critical";
    if (value > 22) return "high";
    if (value > 15) return "medium";
    return "low";
  }

  if (value >= 80) return "critical";
  if (value >= 60) return "high";
  if (value >= 40) return "medium";
  return "low";
}

function formatMetric(metric, value) {
  if (metric === "dispatch") return `${value}m`;
  return `${value}`;
}

export default function Heatmap({ needs = [], zones = [] }) {
  const [selectedZone, setSelectedZone] = useState("");
  const [metric, setMetric] = useState("priority");
  const [severity, setSeverity] = useState("all");

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
    trend: zone.trend || zone.change || "+0%",
    openNeeds: Number(zone.openNeeds || zoneNeeds[zone.zone] || 0),
    avgDispatchMin: Number(zone.avgDispatchMin || 0),
    resolvedNeeds: Number(zone.resolvedNeeds || 0)
  }));

  const zoneLookup = useMemo(() => {
    const lookup = new Map();
    for (const zone of zonesToRender) {
      lookup.set(normalizeZoneName(zone.name), zone);
    }
    return lookup;
  }, [zonesToRender]);

  const effectiveZone = selectedZone || zonesToRender[0]?.name || "";

  const filteredNeeds = useMemo(() => {
    return activeNeeds.filter((need) => {
      if (effectiveZone && normalizeZoneName(need.zone) !== normalizeZoneName(effectiveZone)) {
        return false;
      }

      if (severity === "all") return true;
      return urgencyToLevel(Number(need.urgency || 1)) === severity;
    });
  }, [activeNeeds, effectiveZone, severity]);

  const mapLabels = buildMapLabels(zonesToRender, needs);
  const mapPins = buildNeedPins(filteredNeeds);
  const selectedZoneData = zoneLookup.get(normalizeZoneName(effectiveZone)) || null;

  return (
    <section className="panel">
      <header className="panel-head">
        <h2 className="section-title">Demand Heatmap</h2>
        <p className="section-subtitle">Live map view with urgency markers and zone trend scores</p>
      </header>

      <div className="panel-body">
        <div className="heatmap-toolbar" role="group" aria-label="Heatmap controls">
          <div className="heatmap-control-group">
            <button
              type="button"
              className={`soft-btn ${metric === "priority" ? "is-active" : ""}`}
              onClick={() => setMetric("priority")}
            >
              Priority
            </button>
            <button
              type="button"
              className={`soft-btn ${metric === "open" ? "is-active" : ""}`}
              onClick={() => setMetric("open")}
            >
              Open Needs
            </button>
            <button
              type="button"
              className={`soft-btn ${metric === "dispatch" ? "is-active" : ""}`}
              onClick={() => setMetric("dispatch")}
            >
              Dispatch
            </button>
          </div>

          <div className="heatmap-control-group">
            {[
              { key: "all", label: "All" },
              { key: "critical", label: "Critical" },
              { key: "high", label: "High" },
              { key: "medium", label: "Medium" },
              { key: "low", label: "Low" }
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={`soft-btn ${severity === item.key ? "is-active" : ""}`}
                onClick={() => setSeverity(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="map-canvas" role="img" aria-label="Barmer district live need map">
          <div className="map-grid-lines" />
          <div className="map-glow-zone" />

          {zonesToRender.map((zone, index) => {
            const position = getZonePosition(zone.name, index);
            const value = toMetricValue(zone, metric);
            const toneClass = zoneNodeClass(value, metric);
            const selected = normalizeZoneName(zone.name) === normalizeZoneName(effectiveZone);
            return (
              <button
                key={`node-${zone.name}`}
                type="button"
                className={`map-zone-node ${toneClass} ${selected ? "selected" : ""}`}
                style={{ top: position.top, left: position.left }}
                title={`${zone.name}: ${formatMetric(metric, value)}`}
                aria-label={`${zone.name} ${metric} ${value}`}
                onClick={() => setSelectedZone(zone.name)}
              >
                <strong>{formatMetric(metric, value)}</strong>
              </button>
            );
          })}

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
              title={`${pin.title} | ${pin.category} | ${pin.status} | Urgency ${pin.urgency}`}
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
            <strong>{selectedZoneData ? selectedZoneData.name : "All"}</strong>
            <span>
              {filteredNeeds.length} active
              {severity === "all" ? "" : ` ${severity}`}
            </span>
          </div>
        </div>

        <div className="heatmap-grid">
          {zonesToRender.length === 0 ? <p className="muted">No zone data available.</p> : null}
          {zonesToRender.map((zone) => (
            <article
              className="heat-cell"
              key={zone.name}
              style={{ background: zoneBg(zone.score) }}
              onClick={() => setSelectedZone(zone.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedZone(zone.name);
                }
              }}
            >
              <span className="heat-cell-name" title={zone.name}>{zone.name}</span>
              <strong className="heat-cell-score">{zone.score}</strong>
              <span className="heat-cell-meta">Open {zone.openNeeds} · Resolved {zone.resolvedNeeds}</span>
              <span className="heat-cell-trend">{zone.trend}</span>
            </article>
          ))}
        </div>

        <div className="heatmap-zone-meta">
          <span>
            District total active needs: <strong>{activeNeedsCount}</strong>
          </span>
          <span>
            Showing zone: <strong>{selectedZoneData ? selectedZoneData.name : "All"}</strong>
          </span>
          <span>
            Dispatch avg: <strong>{selectedZoneData ? `${selectedZoneData.avgDispatchMin} min` : "-"}</strong>
          </span>
        </div>
      </div>
    </section>
  );
}