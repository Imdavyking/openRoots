import { LIT_ABILITY, LIT_NETWORK, LIT_RPC } from "@lit-protocol/constants";
import { LitContracts } from "@lit-protocol/contracts-sdk";
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { ethers } from "ethers";
import {
  AuthSig,
  LitAccessControlConditionResource,
  LitActionResource,
  createSiweMessage,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";
import { getSigner, switchOrAddChain } from "./blockchain.services";
import { CHAIN_ID, LIT_PROTOCOL_IDENTIFIER } from "../utils/constants";
import { ethers as ethersv5 } from "ethers-v5";
import { SiweMessage } from "siwe";

export const getSignatureSession = async ({
  capacityDelegationAuthSig,
}: {
  capacityDelegationAuthSig: AuthSig;
}) => {
  try {
    const signer = await getSigner();
    await switchOrAddChain(signer.provider, 175188);
    const provider = new ethersv5.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const ethersSigner = provider.getSigner();

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

    console.log("🔄 Getting Session Sigs via an Auth Sig...");
    const sessionSigs = await litNodeClient.getSessionSigs({
      chain: LIT_PROTOCOL_IDENTIFIER,
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
      capabilityAuthSigs: [capacityDelegationAuthSig],
      resourceAbilityRequests: [
        {
          resource: new LitAccessControlConditionResource("*"),
          ability: LIT_ABILITY.AccessControlConditionDecryption,
        },
      ],
      authNeededCallback: async ({ uri, expiration, resources }) => {
        const litResource = new LitActionResource("*");

        const recapObject =
          await litNodeClient.generateSessionCapabilityObjectWithWildcards([
            litResource,
          ]);

        recapObject.addCapabilityForResource(
          litResource,
          LIT_ABILITY.LitActionExecution
        );

        const verified = recapObject.verifyCapabilitiesForResource(
          litResource,
          LIT_ABILITY.LitActionExecution
        );

        if (!verified) {
          throw new Error("Failed to verify capabilities for resource");
        }

        let nonce = await litNodeClient.getLatestBlockhash();

        let siweMessage = new SiweMessage({
          domain: window.location.host,
          address: await ethersSigner.getAddress(),
          statement: "Some custom statement.", // configure to what ever you would like
          uri,
          version: "1",
          chainId: +Number(CHAIN_ID),
          expirationTime: expiration,
          resources,
          nonce,
        });

        siweMessage = recapObject.addToSiweMessage(siweMessage);

        const messageToSign = siweMessage.prepareMessage();
        const signature = await ethersSigner.signMessage(messageToSign);

        const authSig = {
          sig: signature,
          derivedVia: "web3.eth.personal.sign",
          signedMessage: messageToSign,
          address: await ethersSigner.getAddress(),
        };

        return authSig;
      },
    });

    console.log(
      `✅ Got Session Sigs via an Auth Sig ${JSON.stringify(sessionSigs)}`
    );
    return { sessionSigs };
  } catch (error) {
    console.log(error);
  }
};
