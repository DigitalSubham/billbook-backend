import { NextFunction, Request, Response } from "express";
import pool from "../config/db.js";
import { clean } from "../utils/clean.js";
import ErrorHandler from "../helper/error-handler.js";
import bcrypt from "bcryptjs";

interface AuthRequest extends Request {
  user?: any;
}

export const createSalesman = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, mobile } = req.body;
    if (!email && !password) {
      return next(new ErrorHandler(500, "No required Data"));
    }
    const user_id = req.user.id;

    const isExistingSalesman = await pool.query(
      "SELECT * FROM salesman WHERE (user_id = $1 AND email = $2) OR mobile = $3",
      [user_id, email, mobile]
    );
    if (isExistingSalesman.rows.length > 0) {
      return next(new ErrorHandler(500, "Salesman Already Exists "));
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO salesman (user_id,name,email,mobile,password)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [user_id, name, email, mobile, hashedPassword]
    );

    res
      .status(201)
      .json({ message: "Salesman Added successfully", data: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    throw new ErrorHandler(
      err.statusCode ?? 500,
      err.message ?? "Internal Server Error"
    );
  }
};

export const getSalesman = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user.id;
    const { salesmanId } = req.body;
    const replacement = [user_id];
    let query = "SELECT id,name,email,mobile FROM salesman WHERE user_id = $1";
    if (salesmanId) {
      query += " AND id = $2";
      replacement.push(salesmanId);
    }
    const result = await pool.query(query, replacement);
    res.status(200).json(result.rows);
  } catch (err: any) {
    console.error(err);
    throw new ErrorHandler(
      err.statusCode ?? 500,
      err.message ?? "Internal Server Error"
    );
  }
};

export const updateSalesman = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const {
      name,
      email,
      mobile,
      address,
      state,
      gst_number,
      city,
      pincode,
      customerType,
    } = Object.fromEntries(
      Object.entries(req.body).map(([k, v]) => [k, clean(v)])
    );

    const result = await pool.query(
      `UPDATE customers SET name=$1,email=$2,mobile=$3,address=$4,state=$5,gst_number=$6,city=$7,pincode=$8,customer_type=$9
       WHERE id=$10 AND user_id=$11 RETURNING *`,
      [
        name,
        email,
        mobile,
        address,
        state,
        gst_number,
        city,
        pincode,
        customerType,
        id,
        user_id,
      ]
    );

    if (!result.rows[0]) return res.status(404).json({ message: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteSalesman = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      "DELETE FROM salesman WHERE id=$1 AND user_id=$2 RETURNING *",
      [id, user_id]
    );
    if (!result.rows[0])
      return next(new ErrorHandler(500, "No Salesman Found"));

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err: any) {
    console.error(err);
    throw new ErrorHandler(
      err.statusCode ?? 500,
      err.message ?? "Internal Server Error"
    );
  }
};
