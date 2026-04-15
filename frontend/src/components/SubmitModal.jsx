import { useState } from "react";

export default function SubmitModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: "",
    location: "",
    urgency: 4
  });

  const handleSubmit = () => {
    if (!form.title || !form.location) return;

    onSubmit({
      ...form,
      id: Date.now(),
      time: "just now"
    });

    onClose();
  };

  return (
    <div style={overlay}>
      <div style={modal}>

        <h3>Submit Need</h3>

        <input
          placeholder="Description"
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <input
          placeholder="Location"
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />

        <select
          onChange={(e) => setForm({ ...form, urgency: Number(e.target.value) })}
        >
          <option value="5">Critical</option>
          <option value="4">High</option>
          <option value="3">Medium</option>
        </select>

        <button onClick={handleSubmit}>Submit</button>
        <button onClick={onClose}>Cancel</button>

      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const modal = {
  background: "#0d1420",
  padding: "20px",
  borderRadius: "10px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  width: "300px"
};