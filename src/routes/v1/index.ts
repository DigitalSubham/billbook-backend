import express from "express";
import authRoute from "./auth/auth.routes.js";
import customerRoute from "./customer/customers.routes.js";
import invoiceRoute from "./invoice/invoice.routes.js";
import productRoute from "./product/products.routes.js";
import generalRoute from "./general/general.routes.js";

const router = express.Router();
router.use("/auth", authRoute);
router.use("/customer", customerRoute);
router.use("/invoice", invoiceRoute);
router.use("/product", productRoute);
router.use("/general", generalRoute);

export default router;
