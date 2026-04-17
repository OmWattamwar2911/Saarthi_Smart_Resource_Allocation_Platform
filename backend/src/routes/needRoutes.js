import express from "express";
import {
	assignNeed,
	createNeed,
	deleteNeed,
	getNeedById,
	getNeeds,
	resolveNeed,
	updateNeed
} from "../controllers/needController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getNeeds);
router.get("/:id", getNeedById);
router.post("/", auth, createNeed);
router.patch("/:id", auth, updateNeed);
router.delete("/:id", auth, deleteNeed);
router.patch("/:id/resolve", auth, resolveNeed);
router.patch("/:id/assign", auth, assignNeed);

export default router;