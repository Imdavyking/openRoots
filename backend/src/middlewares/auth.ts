import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { environment } from "../utils/config";
dotenv.config();

export const JWT_SECRET_KEY = environment.JWT_SECRET!;

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"]; // Express lowercases headers automatically

  if (!authHeader) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    res.status(401).json({ error: "Unauthorized: Invalid token format" });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    (req as any).token_data = decoded;

    next();
  } catch (error) {
    res.status(403).json({ error: "Forbidden: Invalid token" });
    return;
  }
};
