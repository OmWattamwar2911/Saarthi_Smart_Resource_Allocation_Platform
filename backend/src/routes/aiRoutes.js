import express from "express";
import multer from "multer";
import { assessDamage, generateAIText, queryAnalytics, runMatching } from "../controllers/aiController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

router.post("/match", runMatching);
router.post("/generate", generateAIText);
router.post("/assess-damage", upload.single("image"), assessDamage);
router.post("/query", queryAnalytics);

export default router;