import { Request, Response } from "express";
import pool from "../config/db.js";
import ErrorHandler from "../helper/error-handler.js";

interface AuthRequest extends Request {
  user?: any;
}

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      selling_rate,
      mrp,
      category,
      stock,
      sku,
      unit,
      tax_percent,
    } = req.body;
    const user_id = req.user.id;

    const result = await pool.query(
      `INSERT INTO products (user_id,name,description,selling_rate,stock,sku,unit,tax_percent,mrp,category)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        user_id,
        name,
        description,
        selling_rate,
        stock,
        sku,
        unit,
        tax_percent,
        mrp,
        category,
      ]
    );

    res.status(201).json({
      message: "Product created successfully",
      product: result.rows[0],
    });
  } catch (err: any) {
    console.error(err);
    throw new ErrorHandler(
      err.statusCode ?? 500,
      err.message ?? "Internal Server Error"
    );
  }
};

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user.id;
    const result = await pool.query("SELECT * FROM products WHERE user_id=$1", [
      user_id,
    ]);
    const data = result.rows.map((product) => ({
      ...product,
      taxRate: Number.parseFloat(product.tax_percent) || 0,
      rate: Number.parseFloat(product.selling_rate),
    }));
    res.json(data);
  } catch (err: any) {
    console.error(err);
    throw new ErrorHandler(
      err.statusCode ?? 500,
      err.message ?? "Internal Server Error"
    );
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    console.log("id", id);
    const result = await pool.query(
      "SELECT * FROM products WHERE id=$1 AND user_id=$2",
      [id, user_id]
    );
    const data = {
      ...result.rows[0],
    };
    if (!result.rows[0]) return res.status(404).json({ message: "Not found" });
    res.json(data);
  } catch (err: any) {
    console.error(err);
    throw new ErrorHandler(
      err.statusCode ?? 500,
      err.message ?? "Internal Server Error"
    );
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      selling_rate,
      stock,
      sku,
      unit,
      tax_percent,
      mrp,
      category,
    } = req.body;
    console.log("req.body", req.body);
    const user_id = req.user.id;

    const result = await pool.query(
      `
      UPDATE products
      SET
        name=$1,
        description=$2,
        selling_rate=$3,
        stock=$4,
        sku=$5,
        unit=$6,
        tax_percent=$7,
        mrp=$8,
        category=$9
      WHERE id=$10 AND user_id=$11
      RETURNING *
      `,
      [
        name,
        description,
        selling_rate,
        stock,
        sku,
        unit,
        tax_percent,
        mrp,
        category,
        id,
        user_id,
      ]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error(err);
    throw new ErrorHandler(
      err.statusCode ?? 500,
      err.message ?? "Internal Server Error"
    );
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const result = await pool.query(
      "DELETE FROM products WHERE id=$1 AND user_id=$2 RETURNING *",
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
