import { mapLabels, mapPins, priorityZones } from "../data/mockData";

function zoneBg(score) {
  if (score > 75) return "rgba(214, 69, 69, 0.12)";
  if (score > 60) return "rgba(235, 125, 45, 0.12)";
  if (score > 45) return "rgba(214, 166, 27, 0.12)";
  return "rgba(35, 164, 106, 0.12)";
}

export default function Heatmap() {
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
            <strong>{mapPins.length}</strong>
            <span>Active needs</span>
          </div>
        </div>

        <div className="heatmap-grid">
          {priorityZones.map((zone) => (
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