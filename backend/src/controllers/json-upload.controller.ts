import { Request, Response } from "express";
import dotenv from "dotenv";
import logger from "../config/logger";
import { uploadToPinata } from "../services/pinata.service";
import io from "../utils/create.websocket";
import { createHash } from "crypto";
dotenv.config();

/**
 * Handles JSON body upload and processing.
 * @param {Request} req - The request object containing the uploaded JSON file.
 * @param {Response} res - The response object to send the result.
 * @route POST /api/upload-json
 */
export const processJSONUpload = async (req: Request, res: Response) => {
  try {
    const jsonData = req.body;
    const socketId = req.query.socketId as string;

    logger.info(`Processing JSON upload for socket ID: ${socketId}`);

    if (!socketId) {
      res.status(400).json({ error: "Socket ID is required" });
      return;
    }

    if (!jsonData) {
      res.status(400).json({ error: "JSON data is required" });
      return;
    }

    io.emit(socketId, {
      message: "Connected",
      status: "success",
    });

    const jsonBuffer = Buffer.from(
      typeof jsonData === "string"
        ? jsonData
        : JSON.stringify(jsonData, null, 2)
    );
    const jsonBlob = new Blob([jsonBuffer], {
      type: "application/json",
    });
    const jsonFile = new File([jsonBlob], "userNFTMetaData.json", {
      type: "application/json",
    });

    const pinataResponse = await uploadToPinata(jsonFile);

    io.emit(socketId, {
      message: "Upload to Pinata successful",
      status: "success",
    });

    if (!pinataResponse) {
      res.status(500).json({ error: "Failed to upload to Pinata" });
      return;
    }

    let ipfsUrl = pinataResponse.getUrl();

    const jsonHash = createHash("sha256").update(jsonBuffer).digest("hex");

    res.status(200).json({
      ipfsUrl,
      jsonHash,
    });
  } catch (error) {}
};
