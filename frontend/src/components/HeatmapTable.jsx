import { useMemo, useState } from "react";

function getCellColor(score) {
  if (score <= 0) return "#ffffff";
  if (score <= 3) return "#d1fae5";
  if (score <= 6) return "#fef3c7";
  if (score <= 8) return "#fed7aa";
  return "#fee2e2";
}

export default function HeatmapTable({ zones = [], categories = [], matrix = {} }) {
  const [tooltip, setTooltip] = useState(null);

  const safeZones = useMemo(() => (zones.length ? zones : []), [zones]);
  const safeCategories = useMemo(() => (categories.length ? categories : []), [categories]);

  return (
    <div style={{ position: "relative", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, overflow: "hidden", borderRadius: 8 }}>
        <thead>
          <tr>
            <th style={{ background: "#f3f4f6", textAlign: "left", padding: 12, fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
              Zone
            </th>
            {safeCategories.map((category) => (
              <th key={category} style={{ background: "#f3f4f6", textAlign: "center", padding: 12, fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
                {category}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeZones.map((zone, index) => (
            <tr key={zone} style={{ background: index % 2 === 0 ? "#ffffff" : "#fcfcfd" }}>
              <td style={{ padding: 12, fontSize: 13, fontWeight: 500, background: "#f9fafb", color: "#111827" }}>{zone}</td>
              {safeCategories.map((category) => {
                const score = Number(matrix?.[zone]?.[category] || 0);
                return (
                  <td
                    key={`${zone}-${category}`}
                    style={{
                      padding: 12,
                      textAlign: "center",
                      fontSize: 13,
                      color: "#111827",
                      background: getCellColor(score),
                      border: "1px solid #f3f4f6",
                      cursor: "default"
                    }}
                    onMouseEnter={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      setTooltip({
                        text: `${zone} - ${category}: score ${score}`,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8
                      });
                    }}
                    onMouseMove={(event) => {
                      setTooltip((current) =>
                        current
                          ? {
                              ...current,
                              x: event.clientX,
                              y: event.clientY - 10
                            }
                          : current
                      );
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    title={`${zone} - ${category}: score ${score}`}
                  >
                    {score}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 14 }}>
        <div
          style={{
            height: 12,
            borderRadius: 999,
            background: "linear-gradient(to right, #ffffff 0%, #d1fae5 20%, #fef3c7 45%, #fed7aa 70%, #fee2e2 100%)",
            border: "1px solid #e5e7eb"
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, color: "#6b7280", fontSize: 12 }}>
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      {tooltip ? (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
            background: "#111827",
            color: "#ffffff",
            fontSize: 12,
            padding: "6px 8px",
            borderRadius: 6,
            pointerEvents: "none",
            zIndex: 20,
            whiteSpace: "nowrap"
          }}
        >
          {tooltip.text}
        </div>
      ) : null}
    </div>
  );
}
