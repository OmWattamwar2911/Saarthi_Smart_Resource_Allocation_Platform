import express from "express";
import { generateReport, getReports, openReportPdf } from "../controllers/reportController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getReports);
router.post("/generate", auth, generateReport);
router.get("/:id/pdf", openReportPdf);

export default router;
