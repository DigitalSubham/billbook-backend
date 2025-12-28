import express from "express";
import { auth } from "../../../middleware/auth.js";
import { getDashboard } from "../../../controllers/dashboard.controller.js";

const router = express.Router();
router.use(auth);

router.get("/", getDashboard);

export default router;
