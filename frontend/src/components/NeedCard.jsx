export default function NeedCard({ need }) {
  const colors = {
    5: "red",
    4: "orange",
    3: "blue",
    2: "green"
  };

  return (
    <div style={{
      padding: "12px",
      borderBottom: "1px solid rgba(255,255,255,0.07)"
    }}>
      <div style={{ display: "flex", gap: "10px" }}>
        
        <div style={{
          background: colors[need.urgency],
          width: "30px",
          height: "30px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {need.urgency}
        </div>

        <div>
          <div>{need.title}</div>
          <div style={{ fontSize: "12px", color: "#6b7a94" }}>
            📍 {need.location} · {need.time}
          </div>
        </div>

      </div>
    </div>
  );
}