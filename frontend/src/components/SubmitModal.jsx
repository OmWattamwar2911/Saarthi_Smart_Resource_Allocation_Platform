import { useState } from "react";

export default function SubmitModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: "",
    location: "",
    category: "Medical",
    urgency: 4
  });

  const handleSubmit = () => {
    if (!form.title || !form.location) return;

    onSubmit({
      ...form,
      id: Date.now(),
      status: "Open",
      time: "just now"
    });

    onClose();
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

        <div className="actions">
          <button className="soft-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleSubmit}>Submit Need</button>
        </div>
      </div>
    </div>
  );
}