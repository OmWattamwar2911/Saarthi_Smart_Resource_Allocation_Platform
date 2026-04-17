import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast, { Toaster } from "react-hot-toast";
import { settingsApi } from "../services/api";
import { useApp } from "../context/AppContext";
import Toggle from "../components/Toggle";
import ConfirmModal from "../components/ConfirmModal";
import DangerConfirmModal from "../components/DangerConfirmModal";

const DIVIDER_STYLE = {
  border: "none",
  borderTop: "1px solid #f0f0f0",
  margin: "24px 0"
};

const SECTION_TITLE_STYLE = {
  fontSize: 14,
  fontWeight: 600,
  color: "#333",
  marginBottom: 16
};

const DEFAULT_FORM = {
  theme: "light",
  platformMode: "Normal",
  notifications: {
    desktopEnabled: true,
    smsAlerts: false,
    emailDigest: false,
    alertThreshold: 7,
    notificationEmail: ""
  },
  aiMatching: {
    autoGenerate: false,
    matchingPriority: "Balanced",
    minConfidenceThreshold: 50,
    requireConfirmation: true,
    maxEtaMinutes: 45
  },
  map: {
    defaultRegion: "Barmer District",
    showVolunteerLocations: true,
    showHeatmap: true,
    mapStyle: "Standard"
  },
  reports: {
    autoExport: "Never",
    exportEmail: "",
    retainResolvedData: true,
    retentionDays: 90
  },
  system: {
    maintenanceMode: false
  }
};

const DEFAULT_STATUS = {
  version: "v1.2.0",
  lastSync: null,
  lastSyncRelative: "Never",
  activeSessions: 1,
  maintenanceMode: false
};

function mergeDefaults(source = {}) {
  return {
    ...DEFAULT_FORM,
    ...source,
    notifications: {
      ...DEFAULT_FORM.notifications,
      ...(source.notifications || {})
    },
    aiMatching: {
      ...DEFAULT_FORM.aiMatching,
      ...(source.aiMatching || {})
    },
    map: {
      ...DEFAULT_FORM.map,
      ...(source.map || {})
    },
    reports: {
      ...DEFAULT_FORM.reports,
      ...(source.reports || {})
    },
    system: {
      ...DEFAULT_FORM.system,
      ...(source.system || {})
    }
  };
}

function relativeFromDate(input) {
  if (!input) {
    return "Never";
  }

  const date = new Date(input);
  if (!Number.isFinite(date.getTime())) {
    return "Unknown";
  }

  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) {
    const minutes = Math.floor(diffSec / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(diffSec / 3600);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function Skeleton({ height = 16 }) {
  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: 8,
        background: "linear-gradient(90deg, #eef2f4 20%, #e5ecef 37%, #eef2f4 63%)",
        backgroundSize: "400% 100%",
        animation: "pulse 1.4s ease infinite"
      }}
    />
  );
}

export default function Settings() {
  const { theme, setTheme } = useApp();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [loading, setLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [savedMode, setSavedMode] = useState("Normal");

  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetMatchesConfirm, setShowResetMatchesConfirm] = useState(false);
  const [showClearAssignmentsConfirm, setShowClearAssignmentsConfirm] = useState(false);

  useEffect(() => {
    const stage = document.querySelector(".main-stage");
    if (!stage) {
      return;
    }

    stage.classList.toggle("dark-mode", form.theme === "dark");
    return () => {
      stage.classList.remove("dark-mode");
    };
  }, [form.theme]);

  async function loadAll() {
    setLoading(true);
    try {
      const [settingsData, statusData] = await Promise.all([settingsApi.get(), settingsApi.status()]);
      const merged = mergeDefaults(settingsData || {});
      setForm(merged);
      setSavedMode(merged.platformMode || "Normal");
      setLastSavedAt(settingsData?.updatedAt || null);
      setStatus({ ...DEFAULT_STATUS, ...(statusData || {}) });
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function setValue(path, value) {
    setForm((current) => {
      const next = { ...current };
      if (path.length === 1) {
        next[path[0]] = value;
      } else {
        const [root, child] = path;
        next[root] = { ...next[root], [child]: value };
      }
      return next;
    });
  }

  const updateMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: (response) => {
      const nextSettings = mergeDefaults(response?.settings || form);
      setForm(nextSettings);
      setSavedMode(nextSettings.platformMode || "Normal");
      setLastSavedAt(response?.settings?.updatedAt || new Date().toISOString());
      toast.success("Settings saved successfully");
      loadAll();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || "Failed to save settings");
    }
  });

  const resetMutation = useMutation({
    mutationFn: settingsApi.reset,
    onSuccess: (response) => {
      const nextSettings = mergeDefaults(response?.settings || DEFAULT_FORM);
      setForm(nextSettings);
      setSavedMode(nextSettings.platformMode || "Normal");
      setLastSavedAt(response?.settings?.updatedAt || new Date().toISOString());
      toast.success("Settings reset to defaults");
      loadAll();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || "Failed to reset settings");
    }
  });

  const forceSyncMutation = useMutation({
    mutationFn: settingsApi.forceSync,
    onSuccess: (response) => {
      setStatus((current) => ({
        ...current,
        lastSync: response?.syncedAt || new Date().toISOString(),
        lastSyncRelative: "Just now"
      }));
      toast.success(`Synced — ${response?.openNeeds ?? 0} open needs, ${response?.availableVolunteers ?? 0} volunteers active`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || "Force sync failed");
    }
  });

  const resetMatchesMutation = useMutation({
    mutationFn: settingsApi.resetMatches,
    onSuccess: (response) => {
      toast.success(`${response?.updated ?? 0} matches reset to pending`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || "Unable to reset matches");
    }
  });

  const clearAssignmentsMutation = useMutation({
    mutationFn: settingsApi.clearAssignments,
    onSuccess: () => {
      toast.success("All assignments cleared");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || "Unable to clear assignments");
    }
  });

  function executeSave() {
    updateMutation.mutate(form);
  }

  function saveSettings() {
    if (savedMode !== "Emergency" && form.platformMode === "Emergency") {
      setShowEmergencyConfirm(true);
      return;
    }
    executeSave();
  }

  const confidenceFill = useMemo(() => Number(form.aiMatching.minConfidenceThreshold || 0), [form.aiMatching.minConfidenceThreshold]);

  const lastSavedLabel = useMemo(() => relativeFromDate(lastSavedAt), [lastSavedAt]);

  const lastSyncLabel = status.lastSyncRelative || relativeFromDate(status.lastSync);

  function clearLocalCache() {
    localStorage.clear();
    sessionStorage.clear();
    toast.success("Local cache cleared");
  }

  return (
    <section className="page">
      <Toaster position="top-right" />
      <section className="panel">
        <header className="panel-head">
          <h2 className="section-title">System Settings</h2>
          <p className="section-subtitle">Platform mode, theme and notification controls.</p>
        </header>
        <div className="panel-body">
          {loading ? (
            <div style={{ display: "grid", gap: "0.8rem" }}>
              <Skeleton height={20} />
              <Skeleton height={42} />
              <Skeleton height={42} />
              <Skeleton height={130} />
            </div>
          ) : (
            <>
              <div>
                <h3 style={SECTION_TITLE_STYLE}>Appearance</h3>
                <label className="need-meta">Theme</label>
                <div className="actions">
                  <button
                    className="soft-btn"
                    style={{ borderColor: form.theme === "light" ? "#00BFA5" : undefined }}
                    onClick={() => {
                      setValue(["theme"], "light");
                      setTheme("light");
                      localStorage.setItem("saarthi_theme", "light");
                    }}
                  >
                    Light
                  </button>
                  <button
                    className="soft-btn"
                    style={{ borderColor: form.theme === "dark" ? "#00BFA5" : undefined }}
                    onClick={() => {
                      setValue(["theme"], "dark");
                      setTheme("dark");
                      localStorage.setItem("saarthi_theme", "dark");
                    }}
                  >
                    Dark
                  </button>
                </div>

                <label className="need-meta">Platform mode</label>
                <select
                  className="input"
                  value={form.platformMode}
                  onChange={(event) => setValue(["platformMode"], event.target.value)}
                >
                  <option value="Normal">Normal</option>
                  <option value="Training">Training</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Simulation">Simulation</option>
                  <option value="Glass Command-Center">Glass Command-Center</option>
                </select>
              </div>

              <hr style={DIVIDER_STYLE} />

              <div>
                <h3 style={SECTION_TITLE_STYLE}>Notifications & Alerts</h3>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Enable desktop notifications</span>
                    <Toggle checked={form.notifications.desktopEnabled} onChange={(value) => setValue(["notifications", "desktopEnabled"], value)} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>SMS alerts for critical needs</span>
                    <Toggle checked={form.notifications.smsAlerts} onChange={(value) => setValue(["notifications", "smsAlerts"], value)} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Email digest (daily summary)</span>
                    <Toggle checked={form.notifications.emailDigest} onChange={(value) => setValue(["notifications", "emailDigest"], value)} />
                  </div>
                  <label className="need-meta">Alert threshold (urgency above)</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={10}
                    value={form.notifications.alertThreshold}
                    onChange={(event) => setValue(["notifications", "alertThreshold"], Number(event.target.value || 0))}
                  />
                  <label className="need-meta">Notification email address</label>
                  <input
                    className="input"
                    value={form.notifications.notificationEmail}
                    onChange={(event) => setValue(["notifications", "notificationEmail"], event.target.value)}
                  />
                </div>
              </div>

              <hr style={DIVIDER_STYLE} />

              <div>
                <h3 style={SECTION_TITLE_STYLE}>AI Matching Settings</h3>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Auto-generate matches every hour</span>
                    <Toggle checked={form.aiMatching.autoGenerate} onChange={(value) => setValue(["aiMatching", "autoGenerate"], value)} />
                  </div>
                  <label className="need-meta">Matching priority</label>
                  <select
                    className="input"
                    value={form.aiMatching.matchingPriority}
                    onChange={(event) => setValue(["aiMatching", "matchingPriority"], event.target.value)}
                  >
                    <option value="Urgency first">Urgency first</option>
                    <option value="Location first">Location first</option>
                    <option value="Skill first">Skill first</option>
                    <option value="Balanced">Balanced</option>
                  </select>
                  <label className="need-meta">Minimum confidence threshold to show a match ({confidenceFill}%)</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={confidenceFill}
                    onChange={(event) => setValue(["aiMatching", "minConfidenceThreshold"], Number(event.target.value || 0))}
                    style={{
                      width: "100%",
                      accentColor: "#00BFA5",
                      background: `linear-gradient(to right, #00BFA5 0%, #00BFA5 ${confidenceFill}%, #d8e1e6 ${confidenceFill}%, #d8e1e6 100%)`
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Require manual confirmation before dispatching</span>
                    <Toggle checked={form.aiMatching.requireConfirmation} onChange={(value) => setValue(["aiMatching", "requireConfirmation"], value)} />
                  </div>
                  <label className="need-meta">Max ETA limit in minutes</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={form.aiMatching.maxEtaMinutes}
                    onChange={(event) => setValue(["aiMatching", "maxEtaMinutes"], Number(event.target.value || 0))}
                  />
                </div>
              </div>

              <hr style={DIVIDER_STYLE} />

              <div>
                <h3 style={SECTION_TITLE_STYLE}>Map & Location</h3>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <label className="need-meta">Default map region</label>
                  <select className="input" value={form.map.defaultRegion} onChange={(event) => setValue(["map", "defaultRegion"], event.target.value)}>
                    <option value="Barmer District">Barmer District</option>
                    <option value="Jaisalmer">Jaisalmer</option>
                    <option value="Jodhpur">Jodhpur</option>
                    <option value="All Rajasthan">All Rajasthan</option>
                  </select>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Show volunteer locations on map</span>
                    <Toggle checked={form.map.showVolunteerLocations} onChange={(value) => setValue(["map", "showVolunteerLocations"], value)} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Show heatmap by default</span>
                    <Toggle checked={form.map.showHeatmap} onChange={(value) => setValue(["map", "showHeatmap"], value)} />
                  </div>
                  <label className="need-meta">Map style</label>
                  <select className="input" value={form.map.mapStyle} onChange={(event) => setValue(["map", "mapStyle"], event.target.value)}>
                    <option value="Standard">Standard</option>
                    <option value="Satellite">Satellite</option>
                    <option value="Terrain">Terrain</option>
                    <option value="Dark">Dark</option>
                  </select>
                </div>
              </div>

              <hr style={DIVIDER_STYLE} />

              <div>
                <h3 style={SECTION_TITLE_STYLE}>Data & Reports</h3>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <label className="need-meta">Auto-export reports</label>
                  <select className="input" value={form.reports.autoExport} onChange={(event) => setValue(["reports", "autoExport"], event.target.value)}>
                    <option value="Never">Never</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                  <label className="need-meta">Export email address</label>
                  <input className="input" value={form.reports.exportEmail} onChange={(event) => setValue(["reports", "exportEmail"], event.target.value)} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Retain resolved needs data for analytics</span>
                    <Toggle checked={form.reports.retainResolvedData} onChange={(value) => setValue(["reports", "retainResolvedData"], value)} />
                  </div>
                  <label className="need-meta">Data retention period in days</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={form.reports.retentionDays}
                    onChange={(event) => setValue(["reports", "retentionDays"], Number(event.target.value || 0))}
                  />
                </div>
              </div>

              <hr style={DIVIDER_STYLE} />

              <div>
                <h3 style={SECTION_TITLE_STYLE}>System & Security</h3>
                <div style={{ display: "grid", gap: "0.7rem" }}>
                  <input className="input" readOnly value={`Platform version: ${status.version || "v1.2.0"}`} style={{ background: "#f4f7f9", color: "#6b7c88" }} />
                  <input className="input" readOnly value={`Last sync: ${lastSyncLabel}`} style={{ background: "#f4f7f9", color: "#6b7c88" }} />
                  <input className="input" readOnly value={`Active sessions: ${status.activeSessions || 1}`} style={{ background: "#f4f7f9", color: "#6b7c88" }} />
                  <input className="input" readOnly value="Google Cloud Project: smart-resource-alloc" style={{ background: "#f4f7f9", color: "#6b7c88" }} />
                  <div className="actions">
                    <button
                      className="soft-btn"
                      style={{ borderColor: "#00BFA5", color: "#0f8e7f" }}
                      onClick={() => forceSyncMutation.mutate()}
                      disabled={forceSyncMutation.isPending}
                    >
                      {forceSyncMutation.isPending ? "Syncing..." : "Force sync with Firestore"}
                    </button>
                    <button className="soft-btn" onClick={clearLocalCache}>Clear local cache</button>
                  </div>
                </div>
              </div>

              <hr style={DIVIDER_STYLE} />

              <div style={{ background: "#fff5f5", border: "1px solid #ffcccc", borderRadius: 8, padding: 16, marginTop: 8 }}>
                <h3 style={{ ...SECTION_TITLE_STYLE, color: "#a21a2b" }}>Danger Zone</h3>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <button
                    className="danger-btn"
                    style={{ background: "transparent", color: "#b42318", borderColor: "#ef4444" }}
                    onClick={() => setShowResetMatchesConfirm(true)}
                  >
                    Reset all matches to pending
                  </button>
                  <button
                    className="danger-btn"
                    style={{ background: "transparent", color: "#b42318", borderColor: "#ef4444" }}
                    onClick={() => setShowClearAssignmentsConfirm(true)}
                  >
                    Clear all assignments
                  </button>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#8f2332", fontWeight: 600 }}>Maintenance mode (disables AI matching)</span>
                    <Toggle checked={form.system.maintenanceMode} onChange={(value) => setValue(["system", "maintenanceMode"], value)} />
                  </div>
                </div>
              </div>

              <div className="actions" style={{ marginTop: "1rem" }}>
                <button
                  className="primary-btn"
                  style={{ background: "#00BFA5" }}
                  onClick={saveSettings}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Settings"}
                </button>
                <button className="danger-btn" onClick={() => setShowResetConfirm(true)}>
                  Reset Settings
                </button>
              </div>

              <p className="need-meta">
                Current mode: {form.platformMode} | Theme: {form.theme} | Last saved: {lastSavedLabel}
              </p>
            </>
          )}
        </div>
      </section>

      <ConfirmModal
        open={showEmergencyConfirm}
        title="Activate Emergency Mode"
        message="Switching to Emergency Mode will boost all open need urgency scores. Are you sure?"
        confirmLabel="Confirm"
        onConfirm={() => {
          setShowEmergencyConfirm(false);
          executeSave();
        }}
        onCancel={() => setShowEmergencyConfirm(false)}
      />

      <ConfirmModal
        open={showResetConfirm}
        title="Reset settings"
        message="Reset all settings to defaults?"
        danger
        confirmLabel="Reset"
        busy={resetMutation.isPending}
        onConfirm={() => {
          setShowResetConfirm(false);
          resetMutation.mutate();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      <ConfirmModal
        open={showResetMatchesConfirm}
        title="Reset matches"
        message="Reset all non-confirmed matches to pending?"
        danger
        confirmLabel="Reset matches"
        busy={resetMatchesMutation.isPending}
        onConfirm={() => {
          setShowResetMatchesConfirm(false);
          resetMatchesMutation.mutate();
        }}
        onCancel={() => setShowResetMatchesConfirm(false)}
      />

      <DangerConfirmModal
        open={showClearAssignmentsConfirm}
        message="This will delete all assignments, set all volunteers to available, and reopen in-progress needs."
        busy={clearAssignmentsMutation.isPending}
        onConfirm={() => {
          setShowClearAssignmentsConfirm(false);
          clearAssignmentsMutation.mutate();
        }}
        onCancel={() => setShowClearAssignmentsConfirm(false)}
      />
    </section>
  );
}
