import { Request, Response } from "express";
import pool from "../config/db.js";
import { generateInvoiceNumber } from "../utils/invoiceNumber.js";
import ErrorHandler from "../helper/error-handler.js";
import camelize from "camelize";

interface AuthRequest extends Request {
  user?: any;
}

export const createInvoice = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      customer_id,
      invoice_type,
      invoice_date,
      due_date,
      payment_status,
      total_amount,
      total_tax,
      cgst_total,
      sgst_total,
      igst_total,
      notes,
      items,
      discount_amnt,
      discount_desc,
      discount_type,
      received_amount,
    } = req.body;
    // NOTE :- Discount type should be ENUM ("PERCENTAGE","ITEM-WISE","FIXED-AMOUNT")
    const user_id = req.user.id;
    const invoice_number = await generateInvoiceNumber(user_id);

    // 1️⃣ Create invoice
    const invoiceRes = await client.query(
      `
      INSERT INTO invoices 
      (user_id, customer_id, invoice_number, invoice_type, invoice_date, due_date, 
        payment_status, total_amount, total_tax, notes,cgst_total,sgst_total,igst_total,discount_amnt,discount_desc,discount_type,received_amount)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *;
      `,
      [
        user_id,
        customer_id,
        invoice_number,
        invoice_type,
        invoice_date,
        due_date,
        payment_status,
        total_amount,
        total_tax,
        notes,
        cgst_total,
        sgst_total,
        igst_total,
        discount_amnt ?? null,
        discount_desc ?? null,
        discount_type ?? null,
        received_amount ?? null,
      ]
    );

    const invoice = invoiceRes.rows[0];

    // 2️⃣ Insert invoice items + Update product stock
    for (const item of items) {
      const {
        product_id,
        product_name,
        quantity,
        selling_rate,
        line_total,
        tax_percent,
        tax_amount,
        cgst,
        sgst,
        igst,
      } = item;

      // Insert invoice item
      await client.query(
        `
        INSERT INTO invoice_items 
        (invoice_id,product_id, product_name, quantity, selling_rate, line_total, tax_percent, tax_amount,cgst,sgst,igst)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        `,
        [
          invoice.id,
          product_id,
          product_name,
          quantity,
          selling_rate,
          line_total,
          tax_percent,
          tax_amount,
          cgst,
          sgst,
          igst,
        ]
      );

      // 3️⃣ Update product stock
      const updateRes = await client.query(
        `
        UPDATE products
        SET stock = stock - $1
        WHERE id = $2 AND stock >= $1
        RETURNING stock;
        `,
        [quantity, product_id]
      );

      // If no row returned → insufficient stoc
      if (updateRes.rowCount === 0) {
        throw new Error(`Product ID ${product_id} has insufficient stock`);
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error(err);
    throw new ErrorHandler(
      err.statusCode ?? 500,
      err.message ?? "Internal Server Error"
    );
  } finally {
    client.release();
  }
};

export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user.id;

    const query = `
      SELECT 
        inv.id,
        inv.invoice_number,
        inv.invoice_type,
        inv.invoice_date,
        inv.due_date,
        inv.payment_status,
        inv.total_amount,
        inv.received_amount,
        inv.total_tax,
        inv.notes,
        inv.created_at,
        inv.cgst_total,
        inv.sgst_total,
        inv.igst_total,

        -- Customer full details
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email,
          'mobile', c.mobile,
          'address', c.address,
          'state', c.state,
          'gst_number', c.gst_number,
          'notes', c.notes
        ) AS customer,

        -- Invoice items as JSON array
        COALESCE(
          json_agg(
            json_build_object(
              'id', ii.id,
              'mrp', p.mrp, 
              'productName', ii.product_name,
              'quantity', ii.quantity,
              'selling_rate', ii.selling_rate,
              'amount', ii.line_total,
              'taxRate', ii.tax_percent,
              'tax_amount', ii.tax_amount
            )
          ) FILTER (WHERE ii.id IS NOT NULL),
          '[]'
        ) AS items

      FROM invoices inv
      LEFT JOIN customers c ON inv.customer_id = c.id
      LEFT JOIN invoice_items ii ON inv.id = ii.invoice_id
      LEFT JOIN products p 
        ON ii.product_id = p.id 
      WHERE inv.user_id = $1
      GROUP BY inv.id, c.id
      ORDER BY inv.created_at DESC;
    `;

    const result = await pool.query(query, [user_id]);
    const finalResponse = camelize(result.rows);
    res.json(finalResponse);
  } catch (err: any) {
    console.error(err);
    throw new ErrorHandler(
      err.statusCode ?? 500,
      err.message ?? "Internal Server Error"
    );
  }
};

export const getInvoiceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const invoiceRes = await pool.query(
      "SELECT * FROM invoices WHERE id=$1 AND user_id=$2",
      [id, user_id]
    );
    if (!invoiceRes.rows[0])
      return res.status(404).json({ message: "Not found" });

    const itemsRes = await pool.query(
      "SELECT * FROM invoice_items WHERE invoice_id=$1",
      [id]
    );

    res.json({ ...invoiceRes.rows[0], items: itemsRes.rows });
  } catch (err: any) {
    console.error(err);
    throw new ErrorHandler(
      err.statusCode ?? 500,
      err.message ?? "Internal Server Error"
    );
  }
};

export const deleteInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      "DELETE FROM invoices WHERE id=$1 AND user_id=$2 RETURNING *",
      [id, user_id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: "Not found" });

    res.json({ message: "Deleted successfully" });
  } catch (err: any) {
    console.error(err);
    throw new ErrorHandler(
      err.statusCode ?? 500,
      err.message ?? "Internal Server Error"
    );
  }
};
