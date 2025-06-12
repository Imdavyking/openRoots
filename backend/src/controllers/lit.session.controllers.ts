import { Request, Response } from "express";
import dotenv from "dotenv";
import logger from "../config/logger";
import { ethers } from "ethers";
import { environment } from "../utils/config";
import { mintCapacityNFT } from "../services/mint.lit.services";
import { encryptString, decryptToString } from "@lit-protocol/encryption";
import { LIT_NETWORK } from "@lit-protocol/constants";
import * as LitJsSdk from "@lit-protocol/lit-node-client";
dotenv.config();

export const getSessionSigs = async (req: Request, res: Response) => {
  try {
    const dataSetABI = new ethers.Interface([
      "function canAccess(string calldata datasetId, address user) external view returns (bool)",
    ]);
    const {
      signature,
      message: datasetId,
    } = req.body;
    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256"],
      [datasetId]
    );

    const ethSignedMessageHash = ethers.hashMessage(
      ethers.getBytes(messageHash)
    );
    const userAddress = ethers.recoverAddress(ethSignedMessageHash, signature);
    const provider = new ethers.JsonRpcProvider(environment.RPC_URL);
    const signer = new ethers.Wallet(environment.PRIVATE_KEY, provider);
    const dataSetContract = new ethers.Contract(
      environment.DATASET_CONTRACT_ADDRESS,
      dataSetABI,
      signer
    );

    const canAccess = await dataSetContract.canAccess(datasetId, userAddress);

    if (!canAccess) {
      res.status(403).json({
        error: "User does not have access to this dataset",
      });
      return;
    }
    if (canAccess) {
      const { capacityDelegationAuthSig } = await mintCapacityNFT(userAddress);
      const litNodeClient = new LitJsSdk.LitNodeClient({
        litNetwork: LIT_NETWORK.DatilTest,
        debug: false,
      });
      await litNodeClient.connect();

      res.status(200).json({
        message: "User has access to this dataset",
        capacityDelegationAuthSig,
      });
    }
  } catch (error) {
    logger.error("Error getting session signatures:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
