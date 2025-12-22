import { Request, Response } from "express";
import pool from "../config/db.js";

interface AuthRequest extends Request {
  user?: any;
}

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user.id;

    // Total customers
    const customersRes = await pool.query(
      "SELECT COUNT(*) FROM customers WHERE user_id=$1",
      [user_id]
    );
    const totalCustomers = parseInt(customersRes.rows[0].count, 10);

    // Total products
    const productsRes = await pool.query(
      "SELECT COUNT(*) FROM products WHERE user_id=$1",
      [user_id]
    );
    const totalProducts = parseInt(productsRes.rows[0].count, 10);

    // Total invoices
    const invoicesRes = await pool.query(
      "SELECT COUNT(*) FROM invoices WHERE user_id=$1",
      [user_id]
    );
    const totalInvoices = parseInt(invoicesRes.rows[0].count, 10);

    // Total paid invoices
    const paidInvoicesRes = await pool.query(
      "SELECT COUNT(*) FROM invoices WHERE user_id=$1 AND payment_status='paid'",
      [user_id]
    );
    const totalPaidInvoices = parseInt(paidInvoicesRes.rows[0].count, 10);

    // Total unpaid invoices
    const unpaidInvoicesRes = await pool.query(
      "SELECT COUNT(*) FROM invoices WHERE user_id=$1 AND payment_status='unpaid'",
      [user_id]
    );
    const totalUnpaidInvoices = parseInt(unpaidInvoicesRes.rows[0].count, 10);

    // Total revenue (sum of paid invoices)
    const revenueRes = await pool.query(
      "SELECT COALESCE(SUM(total_amount),0) as total_revenue FROM invoices WHERE user_id=$1 AND payment_status='paid'",
      [user_id]
    );
    const totalRevenue = parseFloat(revenueRes.rows[0].total_revenue);

    // Recent 5 invoices
    const recentInvoicesRes = await pool.query(
      "SELECT id,invoice_number,customer_id,total_amount,status,payment_status,invoice_date FROM invoices WHERE user_id=$1 ORDER BY invoice_date DESC LIMIT 5",
      [user_id]
    );

    res.json({
      totalCustomers,
      totalProducts,
      totalInvoices,
      totalPaidInvoices,
      totalUnpaidInvoices,
      totalRevenue,
      recentInvoices: recentInvoicesRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
