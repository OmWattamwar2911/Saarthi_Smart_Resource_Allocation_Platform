import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "admin@saarthi.gov", password: "saarthi2024" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nextPath = location.state?.from || "/dashboard";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        await register({ name: form.name, email: form.email, password: form.password });
      }
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page" style={{ maxWidth: 560, margin: "0 auto", paddingTop: "4rem" }}>
      <section className="panel">
        <header className="panel-head">
          <h2 className="section-title">Saarthi Control Access</h2>
          <p className="section-subtitle">Use seeded admin account to access live operations.</p>
        </header>
        <form className="panel-body" onSubmit={handleSubmit}>
          {mode === "register" && (
            <input
              className="input"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          )}
          <input
            className="input"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          {error ? <p style={{ color: "var(--critical)" }}>{error}</p> : null}
          <div className="actions">
            <button disabled={loading} type="submit" className="primary-btn">
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
            </button>
            <button
              type="button"
              className="soft-btn"
              onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}
            >
              Switch to {mode === "login" ? "Register" : "Login"}
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
