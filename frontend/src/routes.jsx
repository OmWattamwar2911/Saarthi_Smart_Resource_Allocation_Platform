import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Needs from "./pages/Needs";
import Matching from "./pages/Matching";
import Volunteers from "./pages/Volunteers";
import Analytics from "./pages/Analytics";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";

export default function RoutesConfig() {
  return (
    <main className="content-wrap">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/needs" element={<Needs />} />
        <Route path="/matching" element={<Matching />} />
        <Route path="/volunteers" element={<Volunteers />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </main>
  );
}