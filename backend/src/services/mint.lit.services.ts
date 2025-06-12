import { LIT_ABILITY, LIT_NETWORK, LIT_RPC } from "@lit-protocol/constants";
import { LitContracts } from "@lit-protocol/contracts-sdk";
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { ethers } from "ethers";
import { environment } from "../utils/config";
import {
  LitAccessControlConditionResource,
  createSiweMessage,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";

export const mintCapacityNFT = async (userAddress: string) => {
  try {
    const ethersSigner = new ethers.Wallet(
      environment.PRIVATE_KEY,
      new ethers.JsonRpcProvider(environment.RPC_URL)
    );

    ethersSigner.provider?.getBlockNumber().then((blockNumber) => {
      console.log("Current block number:", blockNumber);
    });
    console.log("🔄 Connecting LitNodeClient to Lit network...");
    const litNodeClient = new LitJsSdk.LitNodeClient({
      litNetwork: LIT_NETWORK.DatilTest,
      debug: false,
    });
    await litNodeClient.connect();
    console.log("✅ Connected LitNodeClient to Lit network");

    console.log("🔄 Connecting LitContracts client to network...");
    const litContracts = new LitContracts({
      privateKey: environment.PRIVATE_KEY,
      network: LIT_NETWORK.DatilTest,
      debug: false,
    });
    await litContracts.connect();
    console.log("✅ Connected LitContracts client to network");

    let capacityTokenId;

    if (!capacityTokenId) {
      console.log("🔄 Minting Capacity Credits NFT...");
      capacityTokenId = (
        await litContracts.mintCapacityCreditsNFT({
          requestsPerKilosecond: 10,
          daysUntilUTCMidnightExpiration: 1,
        })
      ).capacityTokenIdStr;
      console.log(`✅ Minted new Capacity Credit with ID: ${capacityTokenId}`);
    }

    console.log("🔄 Creating capacityDelegationAuthSig...");
    const { capacityDelegationAuthSig } =
      await litNodeClient.createCapacityDelegationAuthSig({
        dAppOwnerWallet: ethersSigner,
        capacityTokenId,
        delegateeAddresses: [userAddress],
        uses: "1",
      });
    console.log(`✅ Created the capacityDelegationAuthSig`);

    return { capacityDelegationAuthSig };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
