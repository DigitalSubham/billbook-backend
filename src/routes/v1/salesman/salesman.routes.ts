import express from "express";
import { auth } from "../../../middleware/auth.js";
import {
  createSalesman,
  getSalesman,
  updateSalesman,
  deleteSalesman,
} from "../../../controllers/salesman.controller.js";

const router = express.Router();
router.use(auth);

router.post("/create", createSalesman);
router.post("/", getSalesman);
// router.put("/:id", updateProduct);
router.delete("/:id", deleteSalesman);

export default router;
