import { useMemo, useState } from "react";

export default function DangerConfirmModal({
  open,
  title = "Danger: This cannot be undone",
  message,
  busy = false,
  confirmPhrase = "CONFIRM",
  onConfirm,
  onCancel
}) {
  const [value, setValue] = useState("");
  const canConfirm = useMemo(() => value.trim() === confirmPhrase, [value, confirmPhrase]);

  if (!open) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(18, 27, 38, 0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 10000,
        padding: "1rem"
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: "min(560px, 100%)",
          borderRadius: 12,
          border: "1px solid #ffcccc",
          background: "#fff5f5",
          boxShadow: "0 16px 34px rgba(120, 18, 34, 0.2)",
          overflow: "hidden"
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: "1rem 1.1rem", borderBottom: "1px solid #ffd7d7", fontWeight: 700, color: "#b42318" }}>
          {title}
        </div>
        <div style={{ padding: "1rem 1.1rem", color: "#8a1f2c" }}>
          <p style={{ margin: 0 }}>{message}</p>
          <p style={{ margin: "0.7rem 0 0" }}>
            Type <strong>{confirmPhrase}</strong> to continue.
          </p>
          <input
            className="input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={confirmPhrase}
            style={{ marginTop: "0.6rem", background: "#fff", borderColor: "#f3bbbb" }}
          />
        </div>
        <div style={{ padding: "0 1.1rem 1rem", display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
          <button className="soft-btn" type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            className="danger-btn"
            type="button"
            onClick={() => {
              if (canConfirm) {
                onConfirm();
              }
            }}
            disabled={!canConfirm || busy}
          >
            {busy ? "Deleting..." : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
