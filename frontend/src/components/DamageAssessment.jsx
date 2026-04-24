import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { aiApi } from "../services/api";

function urgencyTone(urgency) {
  const value = Number(urgency || 0);
  if (value >= 5) return { color: "#b91c1c", label: "Critical" };
  if (value >= 4) return { color: "#dc2626", label: "High" };
  if (value >= 3) return { color: "#d97706", label: "Moderate" };
  return { color: "#166534", label: "Low" };
}

export default function DamageAssessment() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const assessMutation = useMutation({
    mutationFn: async (selectedFile) => {
      const formData = new FormData();
      formData.append("image", selectedFile);
      return aiApi.assessDamage(formData);
    }
  });

  const urgencyStyle = useMemo(() => urgencyTone(assessMutation.data?.urgency), [assessMutation.data]);

  function onFileChange(event) {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    assessMutation.reset();

    if (selected) {
      const localUrl = URL.createObjectURL(selected);
      setPreviewUrl(localUrl);
      return;
    }

    setPreviewUrl("");
  }

  return (
    <section className="panel" style={{ marginTop: "0.9rem" }}>
      <header className="panel-head">
        <h2 className="section-title">Damage Assessment (Gemini Vision)</h2>
        <p className="section-subtitle">Upload a disaster image to triage urgency and response category</p>
      </header>

      <div className="panel-body" style={{ display: "grid", gap: "0.8rem" }}>
        <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap", alignItems: "center" }}>
          <input type="file" accept="image/*" onChange={onFileChange} />
          <button
            className="primary-btn"
            onClick={() => file && assessMutation.mutate(file)}
            disabled={!file || assessMutation.isPending}
          >
            {assessMutation.isPending ? "Analyzing..." : "Analyze Damage"}
          </button>
        </div>

        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Damage preview"
            style={{ maxWidth: 360, width: "100%", borderRadius: 10, border: "1px solid #cbd5e1" }}
          />
        ) : null}

        {assessMutation.isError ? (
          <p style={{ color: "#b91c1c", margin: 0 }}>
            {assessMutation.error?.response?.data?.error || "Image analysis failed. Please try another image."}
          </p>
        ) : null}

        {assessMutation.data ? (
          <article
            style={{
              border: "1px solid #dbe4ee",
              borderRadius: 12,
              padding: "0.75rem",
              background: "#f8fbff",
              display: "grid",
              gap: "0.5rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <strong>Urgency</strong>
              <span
                style={{
                  border: `1px solid ${urgencyStyle.color}`,
                  color: urgencyStyle.color,
                  borderRadius: 99,
                  padding: "0.15rem 0.55rem",
                  fontWeight: 700
                }}
              >
                {assessMutation.data.urgency}/5 {urgencyStyle.label}
              </span>
            </div>
            <p style={{ margin: 0 }}>
              <strong>Category:</strong> {assessMutation.data.category}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Zone Suggestion:</strong> {assessMutation.data.zoneSuggestion}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Description:</strong> {assessMutation.data.description}
            </p>
          </article>
        ) : null}
      </div>
    </section>
  );
}
