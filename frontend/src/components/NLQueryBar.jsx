import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { aiApi } from "../services/api";

export default function NLQueryBar() {
  const [question, setQuestion] = useState("");

  const queryMutation = useMutation({
    mutationFn: (value) => aiApi.query(value)
  });

  function submitQuery(event) {
    event.preventDefault();
    const clean = question.trim();
    if (!clean) return;
    queryMutation.mutate(clean);
  }

  const rows = Array.isArray(queryMutation.data?.data) ? queryMutation.data.data : [];
  const columns = rows.length ? Object.keys(rows[0] || {}) : [];

  return (
    <section className="panel" style={{ marginBottom: "0.9rem" }}>
      <header className="panel-head">
        <h2 className="section-title">Natural Language Analytics</h2>
        <p className="section-subtitle">Ask operations questions in plain English and get data-backed answers</p>
      </header>

      <div className="panel-body" style={{ display: "grid", gap: "0.75rem" }}>
        <form onSubmit={submitQuery} style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
          <input
            className="input"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Which zone has most unresolved needs?"
            style={{ flex: 1, minWidth: 240 }}
          />
          <button className="primary-btn" type="submit" disabled={queryMutation.isPending}>
            {queryMutation.isPending ? "Analyzing..." : "Ask AI"}
          </button>
        </form>

        {queryMutation.isError ? (
          <p style={{ color: "#b91c1c", margin: 0 }}>
            {queryMutation.error?.response?.data?.error || "Unable to process query right now."}
          </p>
        ) : null}

        {queryMutation.data?.answer ? (
          <article style={{ background: "#f8fbff", border: "1px solid #dbe4ee", borderRadius: 10, padding: "0.75rem" }}>
            <p style={{ margin: 0, lineHeight: 1.55 }}>{queryMutation.data.answer}</p>
          </article>
        ) : null}

        {rows.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`row-${index}`}>
                    {columns.map((column) => (
                      <td key={`${column}-${index}`}>{String(row[column] ?? "-")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
