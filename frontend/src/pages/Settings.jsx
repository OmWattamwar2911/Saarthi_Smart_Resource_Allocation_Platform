import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { settingsApi } from "../services/api";
import { useApp } from "../context/AppContext";

export default function Settings() {
  const { theme, setTheme } = useApp();
  const { data, refetch } = useQuery({ queryKey: ["settings"], queryFn: settingsApi.get });
  const [mode, setMode] = useState("Normal");

  const updateMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => refetch()
  });

  const resetMutation = useMutation({
    mutationFn: settingsApi.reset,
    onSuccess: () => refetch()
  });

  return (
    <section className="page">
      <section className="panel">
        <header className="panel-head">
          <h2 className="section-title">System Settings</h2>
          <p className="section-subtitle">Platform mode, theme and notification controls.</p>
        </header>
        <div className="panel-body">
          <label className="need-meta">Theme</label>
          <div className="actions">
            <button className="soft-btn" onClick={() => setTheme("light")}>Light</button>
            <button className="soft-btn" onClick={() => setTheme("dark")}>Dark</button>
          </div>

          <label className="need-meta">Platform mode</label>
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="Normal">Normal</option>
            <option value="Emergency">Emergency</option>
            <option value="Training">Training</option>
          </select>

          <div className="actions">
            <button
              className="primary-btn"
              onClick={() => updateMutation.mutate({ platformMode: mode, theme })}
            >
              Save Settings
            </button>
            <button className="danger-btn" onClick={() => resetMutation.mutate()}>
              Reset Settings
            </button>
          </div>

          {data ? <p className="need-meta">Current mode: {data.platformMode} | Theme: {data.theme}</p> : null}
        </div>
      </section>
    </section>
  );
}
