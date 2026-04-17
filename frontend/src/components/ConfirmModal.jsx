export default function ConfirmModal({
  open,
  title = "Please confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 28, 40, 0.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
        padding: "1rem"
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: "min(520px, 100%)",
          borderRadius: 12,
          border: "1px solid #d9e2e7",
          background: "#ffffff",
          boxShadow: "0 12px 30px rgba(18, 37, 52, 0.18)",
          overflow: "hidden"
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: "1rem 1.1rem", borderBottom: "1px solid #eef2f4", fontWeight: 700, color: "#223646" }}>
          {title}
        </div>
        <div style={{ padding: "1rem 1.1rem", color: "#4e6472" }}>{message}</div>
        <div style={{ padding: "0 1.1rem 1rem", display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
          <button className="soft-btn" type="button" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            className={danger ? "danger-btn" : "primary-btn"}
            type="button"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
