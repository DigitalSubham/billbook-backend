import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import customerRoutes from "./routes/customers.routes.js";
import productRoutes from "./routes/products.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import ServerlessHttp from "serverless-http";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Hello, BillBook Backend is running!" });
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        count(*) AS total_connections,
        sum(CASE WHEN state = 'active' THEN 1 ELSE 0 END) AS active_connections,
        sum(CASE WHEN state = 'idle' THEN 1 ELSE 0 END) AS idle_connections
      FROM pg_stat_activity;
    `);
    res.json({ status: "connected", time: result });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export const handler = ServerlessHttp(app);
