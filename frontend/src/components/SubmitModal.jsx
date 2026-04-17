import { useState } from "react";

export default function SubmitModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: "",
    location: "",
    category: "Medical",
    urgency: 4
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.title || !form.location) return;

    setError("");
    setIsSubmitting(true);

    try {
      await onSubmit({
        ...form,
        id: Date.now(),
        status: "Open",
        time: "just now"
      });
      onClose();
    } catch {
      setError("Could not submit need. Please check your session and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>Submit Need</h3>
        <p className="section-subtitle">Create a verified incident for dispatch matching.</p>

        <div className="form-grid">
          <input
            placeholder="Need description"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />

          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="Medical">Medical</option>
            <option value="Food">Food</option>
            <option value="Shelter">Shelter</option>
            <option value="Water">Water</option>
          </select>

          <select
            value={form.urgency}
            onChange={(e) => setForm({ ...form, urgency: Number(e.target.value) })}
          >
            <option value="5">Critical</option>
            <option value="4">High</option>
            <option value="3">Moderate</option>
            <option value="2">Low</option>
          </select>
        </div>

        {error ? <p className="need-meta" style={{ color: "var(--critical)" }}>{error}</p> : null}

        <div className="actions">
          <button className="soft-btn" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button className="primary-btn" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Need"}
          </button>
        </div>
      </div>
    </div>
  );
}