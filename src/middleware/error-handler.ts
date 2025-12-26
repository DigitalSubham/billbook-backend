import { Response } from "express";

export const handleError = (err: any, res: Response) => {
  const { statusCode = 500, message } = err;

  res.status(statusCode).json({
    status: 500,
    statusCode,
    message,
  });
};
