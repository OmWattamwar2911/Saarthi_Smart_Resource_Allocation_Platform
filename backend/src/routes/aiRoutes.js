import express from "express";
import { generateAIText, runMatching } from "../controllers/aiController.js";

const router = express.Router();

router.post("/match", runMatching);
router.post("/generate", generateAIText);

export default router;