export default function Toggle({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || "Toggle"}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onChange(!checked);
        }
      }}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        border: "1px solid #c9d3da",
        background: checked ? "#00BFA5" : "#c7d1d7",
        position: "relative",
        transition: "all 0.25s ease",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 22 : 2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          transition: "left 0.25s ease"
        }}
      />
    </button>
  );
}
