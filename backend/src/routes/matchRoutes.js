import express from "express";
import {
  confirmMatch,
  generateMatchesController,
  getMatches,
  rejectMatch
} from "../controllers/matchController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getMatches);
router.post("/generate", auth, generateMatchesController);
router.patch("/:id/confirm", auth, confirmMatch);
router.patch("/:id/reject", auth, rejectMatch);

export default router;
