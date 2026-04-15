import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

export default function RoutesConfig() {
  return (
    <div style={{ flex: 1 }}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </div>
  );
}