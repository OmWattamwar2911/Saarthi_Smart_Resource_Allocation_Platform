export default function Heatmap() {
  return (
    <div style={{
      height: "300px",
      background: "#05080f",
      borderRadius: "12px",
      position: "relative"
    }}>

      {/* Fake Pins */}
      <div style={{
        width: "10px",
        height: "10px",
        background: "red",
        borderRadius: "50%",
        position: "absolute",
        top: "30%",
        left: "40%"
      }} />

      <div style={{
        width: "10px",
        height: "10px",
        background: "orange",
        borderRadius: "50%",
        position: "absolute",
        top: "60%",
        left: "20%"
      }} />

      <div style={{
        position: "absolute",
        bottom: "10px",
        left: "10px",
        fontSize: "12px",
        color: "#6b7a94"
      }}>
        Live Need Heatmap (UI Demo)
      </div>

    </div>
  );
}