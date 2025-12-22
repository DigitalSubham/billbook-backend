import express from "express";
import { auth } from "../middleware/auth.js";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  deleteInvoice,
} from "../controllers/invoice.controller.js";

const router = express.Router();
router.use(auth);

router.post("/", createInvoice);
router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.delete("/:id", deleteInvoice);

export default router;
