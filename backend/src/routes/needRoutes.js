import express from "express";
import { createNeed, getNeeds, resolveNeed } from "../controllers/needController.js";

const router = express.Router();

router.get("/", getNeeds);
router.post("/", createNeed);
router.patch("/:id/resolve", resolveNeed);

export default router;