import express from "express";
import { generateImpactReport } from "../controllers/reportController.js";

const router = express.Router();

router.post("/generate", generateImpactReport);

export default router;
