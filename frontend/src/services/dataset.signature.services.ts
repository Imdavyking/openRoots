import { ethers } from "ethers";
import { getSigner } from "./blockchain.services";

export const signDataSetId = async (dataSetId: number) => {
  const messageHash = ethers.solidityPackedKeccak256(["uint256"], [dataSetId]);

  const ethSignedMessageHash = ethers.hashMessage(ethers.getBytes(messageHash));

  const wallet = await getSigner();
  const walletAddress = await wallet.getAddress();

  const signature = await wallet.signMessage(ethers.getBytes(messageHash));

  const signerAddress = ethers.recoverAddress(ethSignedMessageHash, signature);

  if (signerAddress !== walletAddress) {
    throw new Error("Invalid signature");
  }

  return signature;
};
