import { useState } from "react";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import NeedCard from "../components/NeedCard";
import Heatmap from "../components/Heatmap";
import SubmitModal from "../components/SubmitModal";
import { initialNeeds } from "../data/mockData";

export default function Dashboard() {
  const [needs, setNeeds] = useState(initialNeeds);
  const [showModal, setShowModal] = useState(false);

  const addNeed = (newNeed) => {
    setNeeds([newNeed, ...needs]);
  };

  return (
    <div style={{ flex: 1 }}>
      <Topbar />

      <div style={{ padding: "20px" }}>

        {/* Stats */}
        <div style={{ display: "flex", gap: "10px" }}>
          <StatCard title="Open Needs" value={needs.length} color="red" />
          <StatCard title="Volunteers" value="18" color="#22d3a0" />
          <StatCard title="AI Accuracy" value="94%" color="#3b82f6" />
          <StatCard title="People Helped" value="1240" color="orange" />
        </div>

        {/* Grid */}
        <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>

          {/* Heatmap */}
          <div style={{ flex: 2 }}>
            <Heatmap />
          </div>

          {/* Needs Feed */}
          <div style={{
            flex: 1,
            background: "#0f1824",
            borderRadius: "12px",
            overflow: "hidden"
          }}>
            <div style={{ padding: "10px" }}>
              <button onClick={() => setShowModal(true)}>
                + Submit Need
              </button>
            </div>

            {needs.map((n) => (
              <NeedCard key={n.id} need={n} />
            ))}
          </div>

        </div>

      </div>

      {showModal && (
        <SubmitModal
          onClose={() => setShowModal(false)}
          onSubmit={addNeed}
        />
      )}
    </div>
  );
}