import { ethers } from "ethers";
import dotenv from "dotenv";
import { environment } from "../utils/config";

dotenv.config();

export const signDataSetCid = async (cid: string, datasetId: string) => {
  const wallet = new ethers.Wallet(environment.PRIVATE_KEY);

  const messageHash = ethers.solidityPackedKeccak256(
    ["string", "string"],
    [datasetId, cid]
  );

  const ethSignedMessageHash = ethers.hashMessage(ethers.getBytes(messageHash));

  const signature = await wallet.signMessage(ethers.getBytes(messageHash));

  const addressThatSign = ethers.recoverAddress(
    ethSignedMessageHash,
    signature
  );

  if (addressThatSign !== wallet.address) {
    throw new Error("Invalid signature");
  }

  return { signature };
};
