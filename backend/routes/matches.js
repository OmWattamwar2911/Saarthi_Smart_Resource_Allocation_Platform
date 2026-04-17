import express from "express";
import {
  confirmAssignmentByMatchId,
  countNeedsByStatus,
  countPendingAssignments,
  countConfirmedAssignments,
  createAssignments,
  getAssignmentsDesc,
  getAssignmentByMatchId,
  getAvailableVolunteers,
  getOpenNeeds,
  parseEtaMinutes
} from "../services/firestore.js";
import { generateAssignmentsWithGemini } from "../services/gemini.js";

const router = express.Router();

function computeAvgDispatchMin(assignments) {
  if (!assignments.length) {
    return 0;
  }

  const total = assignments.reduce((sum, assignment) => sum + parseEtaMinutes(assignment.eta), 0);
  return Math.round(total / assignments.length);
}

router.post("/generate", async (req, res) => {
  const [needs, volunteers] = await Promise.all([getOpenNeeds(), getAvailableVolunteers()]);

  if (!needs.length || !volunteers.length) {
    return res.json([]);
  }

  let generated;
  try {
    generated = await generateAssignmentsWithGemini(needs, volunteers);
  } catch (error) {
    return res.status(500).json({
      error: "AI matching failed",
      details: error?.message || "Unknown error"
    });
  }

  const createdAssignments = await createAssignments(generated);
  return res.status(201).json(createdAssignments);
});

router.get("/", async (req, res) => {
  const assignments = await getAssignmentsDesc();
  const avgDispatchMin = computeAvgDispatchMin(assignments);
  const pendingCount = assignments.filter((item) => item.status === "pending").length;

  return res.json({
    assignments,
    stats: {
      totalMatches: assignments.length,
      avgDispatchTime: `${avgDispatchMin} min`,
      liveMonitoring: true,
      notifications: pendingCount
    }
  });
});

router.patch("/:matchId/confirm", async (req, res) => {
  const { matchId } = req.params;
  const updated = await confirmAssignmentByMatchId(matchId);

  if (!updated) {
    return res.status(404).json({ error: "Assignment not found" });
  }

  return res.json(updated);
});

router.patch("/:matchId/reject", async (req, res) => {
  const { matchId } = req.params;
  const assignment = await getAssignmentByMatchId(matchId);
  if (!assignment) {
    return res.status(404).json({ error: "Assignment not found" });
  }

  await assignment.ref.update({
    status: "rejected"
  });

  return res.json({ ...assignment.data, status: "rejected" });
});

router.get("/stats", async (req, res) => {
  const [assignments, notifications, totalOpen, totalConfirmed] = await Promise.all([
    getAssignmentsDesc(),
    countPendingAssignments(),
    countNeedsByStatus("open"),
    countConfirmedAssignments()
  ]);

  const avgDispatchMin = computeAvgDispatchMin(assignments);

  return res.json({
    notifications,
    avgDispatchMin,
    liveMonitoring: true,
    totalOpen,
    totalConfirmed
  });
});

export default router;
