import express from "express";
import { generateReport, getReports, openReportPdf } from "../controllers/reportController.js";

const router = express.Router();

router.get("/", getReports);
router.post("/generate", generateReport);
router.get("/:id/pdf", openReportPdf);

export default router;
