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
      base_Unit,
      conversion_factor,
      unit_type,
      tax_percent,
    } = req.body;
    const user_id = req.user.id;

    const result = await pool.query(
      `INSERT INTO products (user_id,name,description,selling_rate,stock,sku,unit,tax_percent,mrp,category,base_unit,conversion_factor,unit_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
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
        base_Unit,
        conversion_factor,
        unit_type,
      ],
    );

    res.status(201).json({
      message: "Product created successfully",
      product: result.rows[0],
    });
  } catch (err: any) {
    console.error(err);
    throw new ErrorHandler(
      err.statusCode ?? 500,
      err.message ?? "Internal Server Error",
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
      baseUnit: product.base_unit,
      conversionFactor: product.conversion_factor,
      unitType: product.unit_type,
    }));
    res.json(data);
  } catch (err: any) {
    console.error(err);
    throw new ErrorHandler(
      err.statusCode ?? 500,
      err.message ?? "Internal Server Error",
    );
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const result = await pool.query(
      "SELECT * FROM products WHERE id=$1 AND user_id=$2",
      [id, user_id],
    );
    const data = {
      ...result.rows[0],
      conversionFactor: result.rows[0].conversion_factor,
      unitType: result.rows[0].unit_type,
      baseUnit: result.rows[0].base_unit,
    };

    console.log("data", data);
    if (!result.rows[0]) return res.status(404).json({ message: "Not found" });
    res.json(data);
  } catch (err: any) {
    console.error(err);
    throw new ErrorHandler(
      err.statusCode ?? 500,
      err.message ?? "Internal Server Error",
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
      is_active,
      unit_type,
      base_unit,
      conversion_factor,
    } = req.body;
    const user_id = req.user.id;
    console.log("conversion_factor", conversion_factor, stock);

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
        category=$9,
        is_active=$10,
        base_unit=$11,
        conversion_factor=$12,
        unit_type=$13
      WHERE id=$14 AND user_id=$15
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
        is_active ?? true,
        base_unit,
        conversion_factor,
        unit_type,
        id,
        user_id,
      ],
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error(err);
    throw new ErrorHandler(
      err.statusCode ?? 500,
      err.message ?? "Internal Server Error",
    );
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const result = await pool.query(
      "DELETE FROM products WHERE id=$1 AND user_id=$2 RETURNING *",
      [id, user_id],
    );
    if (!result.rows[0]) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err: any) {
    console.error(err);
    throw new ErrorHandler(
      err.statusCode ?? 500,
      err.message ?? "Internal Server Error",
    );
  }
};
