import { Request, Response } from "express";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import logger from "../config/logger";
import { ethers } from "ethers";
import { uploadToPinata } from "../services/pinata.service";
import io from "../utils/create.websocket";
import { createHash } from "crypto";
dotenv.config();

// Configure multer to accept only .csv files
const storage = multer.memoryStorage(); // you can also use diskStorage if preferred
export const upload = multer({
  storage,
  fileFilter: (
    _: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".csv") {
      return cb(new Error("Only CSV files are allowed"));
    }
    cb(null, true);
  },
});

/**
 * Handles CSV file upload and processing.
 * @param {Request} req - The request object containing the uploaded CSV file.
 * @param {Response} res - The response object to send the result.
 * @route POST /api/upload-csv
 */
export const processCSVUpload = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const socketId = req.query.socketId as string;

    logger.info(`Processing CSV upload for socket ID: ${socketId}`);

    if (!socketId) {
      res.status(400).json({ error: "Socket ID is required" });
      return;
    }

    if (!file) {
      res.status(400).json({ error: "CSV file is required" });
      return;
    }

    io.emit(socketId, {
      message: "Connected",
      status: "success",
    });

    const csvBlob = new Blob([file.buffer], { type: file.mimetype });
    const csvfile = new File([csvBlob], file.filename, {
      type: file.mimetype,
    });

    const pinataResponse = await uploadToPinata(csvfile);

    io.emit(socketId, {
      message: "Upload to Pinata successful",
      status: "success",
    });

    if (!pinataResponse) {
      res.status(500).json({ error: "Failed to upload to Pinata" });
      return;
    }

    let ipfsUrl = pinataResponse.getUrl();
    const csvHash = createHash("sha256").update(file.buffer).digest("hex");
    res.status(200).json({
      ipfsUrl,
      csvHash,
    });

    return;
  } catch (error) {
    if (error instanceof Error) {
      logger.info(`Error processing CSV upload: ${error.message}`);
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
