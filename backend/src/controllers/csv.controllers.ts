import { Request, Response } from "express";
import dotenv from "dotenv";
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { encryptString, decryptToString } from "@lit-protocol/encryption";
import multer from "multer";
import path from "path";
import logger from "../config/logger";
import { ethers } from "ethers";
import { environment } from "../utils/config";
import { uploadToPinata } from "../services/pinata.services";
import io from "../utils/create.websocket";
import { signDataSetCid } from "../services/sign.dataset.services";
import { encryptCid } from "../services/rand.mu.services";
import { encodeCiphertextToSolidity } from "blocklock-js";
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

const generateUniqueId = () => ethers.hexlify(ethers.randomBytes(32));

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
    const isEncrypted = req.query.isEncrypted as string;
    const extraBlocks = req.query.extraBlocks as string;

    logger.info(`Processing CSV upload for socket ID: ${socketId}`);

    if (!socketId) {
      res.status(400).json({ error: "Socket ID is required" });
      return;
    }

    if (!file) {
      res.status(400).json({ error: "CSV file is required" });
      return;
    }

    const litNodeClient = new LitJsSdk.LitNodeClientNodeJs({
      alertWhenUnauthorized: false,
      litNetwork: LIT_NETWORK.DatilTest,
      debug: false,
    });

    io.emit(socketId, {
      message: "Connecting to Lit Node...",
      status: "info",
    });

    await litNodeClient.connect();

    io.emit(socketId, {
      message: "Connected to Lit Node",
      status: "success",
    });

    const datasetId = generateUniqueId().replace(/-/g, "");

    const evmContractConditions: any = [
      {
        contractAddress: environment.DATASET_CONTRACT_ADDRESS,
        chain: environment.LIT_PROTOCOL_IDENTIFIER,
        functionName: "canAccess",
        functionParams: [datasetId, ":userAddress"],
        functionAbi: {
          inputs: [
            { internalType: "string", name: "datasetId", type: "string" },
            { internalType: "address", name: "user", type: "address" },
          ],
          name: "canAccess",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function",
        },
        returnValueTest: {
          key: "",
          comparator: "=",
          value: "true",
        },
      },
    ];

    io.emit(socketId, {
      message: "Generating access control conditions...",
      status: "info",
    });
    const { ciphertext, dataToEncryptHash } = await encryptString(
      {
        evmContractConditions,
        dataToEncrypt: file.buffer.toString("utf-8"),
      },
      litNodeClient
    );

    io.emit(socketId, {
      message: "Data encrypted successfully",
      status: "success",
    });
    const nftMetaJsonBuffer = Buffer.from(
      JSON.stringify(
        { ciphertext, dataToEncryptHash, evmContractConditions },
        null,
        2
      )
    );
    const nftMetaJsonBlob = new Blob([nftMetaJsonBuffer], {
      type: "application/json",
    });
    const nftMetaJsonFile = new File(
      [nftMetaJsonBlob],
      `encrypted-${datasetId}.json`,
      {
        type: "application/json",
      }
    );

    io.emit(socketId, {
      message: "Uploading to Pinata...",
      status: "info",
    });

    const pinataResponse = await uploadToPinata(nftMetaJsonFile);

    io.emit(socketId, {
      message: "Upload to Pinata successful",
      status: "success",
    });

    if (!pinataResponse) {
      res.status(500).json({ error: "Failed to upload to Pinata" });
      return;
    }

    let cid = pinataResponse.getUrl().split("/").pop();

    if (isEncrypted === "true") {
      const { randMuCipher, blockHeight } = await encryptCid(
        cid!,
        +extraBlocks!
      );
      cid = "";
      const { signature } = await signDataSetCid(cid!, datasetId);

      let randMuCiphertext = encodeCiphertextToSolidity(randMuCipher);

      const randMuCiphertextTx = {
        u: {
          x: [
            randMuCiphertext.u.x[0].toString(),
            randMuCiphertext.u.x[1].toString(),
          ],
          y: [
            randMuCiphertext.u.y[0].toString(),
            randMuCiphertext.u.y[1].toString(),
          ],
        },
        v: ethers.hexlify(randMuCiphertext.v),
        w: ethers.hexlify(randMuCiphertext.w),
      };

      res.status(200).json({
        cid,
        datasetId,
        signature,
        randMuCiphertext: randMuCiphertextTx,
        blockHeight: Number(blockHeight),
      });
      return;
    }

    const { signature } = await signDataSetCid(cid!, datasetId);

    res.status(200).json({
      cid,
      datasetId,
      signature,
    });

    return;
  } catch (error) {
    if (error instanceof Error) {
      logger.info(`Error processing CSV upload: ${error.message}`);
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
