import {
  BLOCK_EXPLORER_URL,
  CHAIN_ID,
  CHAIN_NAME,
  CHAIN_SYMBOL,
  CURRENCY_NAME,
  DATASET_CONTRACT_ADDRESS,
  RPC_URL,
} from "../utils/constants";
import { BrowserProvider, ethers } from "ethers";
import datasetAbi from "../assets/json/dataset.abi.json";

const failedKey = "FAILED-";

declare global {
  interface Window {
    ethereum: any;
  }
}

const datasetMarketPlaceAbi = new ethers.Interface(datasetAbi);

export async function switchOrAddChain(
  ethProvider: ethers.JsonRpcApiProvider,
  switchChainId: string | number
) {
  try {
    const currentChainId = Number(
      await ethProvider.provider.send("eth_chainId", [])
    );
    const targetChainId = Number(switchChainId);
    const chainIdHex = `0x${targetChainId.toString(16)}`;

    console.log(
      `Current chainId: ${currentChainId}, Switch chainId: ${targetChainId}`
    );

    if (currentChainId === targetChainId) {
      console.log(`Already connected to ${targetChainId}`);
      return;
    }

    try {
      await ethProvider.provider.send("wallet_switchEthereumChain", [
        { chainId: chainIdHex },
      ]);
      console.log(`Switched to ${targetChainId}`);
    } catch (error) {
      console.error(`Error switching chain:`, error);

      if (error.code === 4902) {
        console.log(`Chain ${targetChainId} not found. Attempting to add.`);
        const yellowStoneChainId = Number(175188);
        const mainChainId = Number(CHAIN_ID);
        const configuredChains = {
          [mainChainId]: {
            chainName: CHAIN_NAME,
            nativeCurrency: {
              name: CURRENCY_NAME,
              symbol: CHAIN_SYMBOL,
              decimals: 18,
            },
            rpcUrls: [RPC_URL],
            blockExplorerUrls: [BLOCK_EXPLORER_URL],
          },
          [yellowStoneChainId]: {
            chainName: "Chronicle Yellowstone - Lit Protocol Testnet",
            nativeCurrency: {
              name: "tstLPX",
              symbol: "tstLPX",
              decimals: 18,
            },
            rpcUrls: ["https://yellowstone-rpc.litprotocol.com/"],
            blockExplorerUrls: [
              "https://yellowstone-explorer.litprotocol.com/",
            ],
          },
        };

        console.log(`Configured chains:`, configuredChains);

        if (configuredChains[targetChainId]) {
          await ethProvider.provider.send("wallet_addEthereumChain", [
            {
              chainId: chainIdHex,
              ...configuredChains[targetChainId],
            },
          ]);
          console.log(`Added and switched to ${targetChainId}`);
        }

        // if (targetChainId === Number(CHAIN_ID)) {
        //   await ethProvider.provider.send("wallet_addEthereumChain", [
        //     {
        //       chainId: chainIdHex,
        //       chainName: CHAIN_NAME,
        //       nativeCurrency: {
        //         name: CURRENCY_NAME,
        //         symbol: CHAIN_SYMBOL,
        //         decimals: 18,
        //       },
        //       rpcUrls: [RPC_URL],
        //       blockExplorerUrls: [BLOCK_EXPLORER_URL],
        //     },
        //   ]);
        //   console.log(`${CHAIN_NAME} added and switched`);
        // }
      } else {
        console.error(`Failed to switch to ${targetChainId}:`, error);
      }
    }
  } catch (error) {
    console.error(`Unexpected error in switchOrAddChain:`, error);
  }
}

function parseContractError(error: any, contractInterface: ethers.Interface) {
  if (!error?.data || !contractInterface) return null;

  try {
    const errorFragment = contractInterface.fragments.find(
      (fragment) =>
        fragment.type === "error" &&
        error.data.startsWith((fragment as any).selector)
    );

    return errorFragment ? contractInterface.parseError(error.data) : null;
  } catch (err) {
    console.error("Error parsing contract error:", err);
    return null;
  }
}

export const getSigner = async () => {
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
};

export const getDatasetContract = async () => {
  if (!window.ethereum) {
    console.log(
      "MetaMask is not installed. Please install it to use this feature."
    );
    return;
  }

  const signer = await getSigner();

  await switchOrAddChain(signer.provider, CHAIN_ID);

  return new ethers.Contract(
    DATASET_CONTRACT_ADDRESS,
    datasetMarketPlaceAbi,
    signer
  );
};

export const saveDatasetCid = async ({
  datasetId,
  cid,
  price,
  category,
  preview,
  title,
  signature,
  randMuCiphertext,
  blockHeight,
}: {
  datasetId: string;
  cid: string;
  price: number | string;
  category: number | string;
  preview: string;
  title: string;
  signature: string;
  randMuCiphertext: string;
  blockHeight: number;
}) => {
  try {
    const datasetContract = await getDatasetContract();

    if (!datasetContract) {
      console.error("Failed to get dataset contract");
      return;
    }

    if (randMuCiphertext) {
      const transaction = await datasetContract.uploadEncryptedDataset(
        datasetId,
        ethers.parseEther(price.toString()),
        category,
        preview,
        title,
        signature,
        blockHeight,
        randMuCiphertext
      );
      const receipt = await transaction.wait(1);
      return `Uploaded Encrypted dataset with tx hash: ${receipt.transactionHash}`;
    }

    const transaction = await datasetContract.uploadDataset(
      datasetId,
      cid,
      ethers.parseEther(price.toString()),
      category,
      preview,
      title,
      signature
    );
    const receipt = await transaction.wait(1);
    return `Uploaded dataset with tx hash: ${receipt.transactionHash}`;
  } catch (error) {
    const parsedError = parseContractError(error, datasetMarketPlaceAbi);
    console.error("Error saving cid:", error);
    return `${failedKey}${parsedError?.name ?? error.message}`;
  }
};

export const getAllDatasets = async () => {
  try {
    const datasetContract = await getDatasetContract();

    if (!datasetContract) {
      console.error("Failed to get dataset contract");
      return;
    }

    const allDatasets = await datasetContract.getAllDatasets();
    return allDatasets;
  } catch (error) {
    console.error("Error fetching datasets:", error);
    return [];
  }
};

export const purchaseAccess = async (datasetId: number) => {
  try {
    const datasetContract = await getDatasetContract();

    if (!datasetContract) {
      console.error("Failed to get dataset contract");
      return;
    }

    const getDataset = await datasetContract.getDataset(datasetId);
    const price = getDataset[1];

    const transaction = await datasetContract.purchaseAccess(datasetId, {
      value: price,
    });
    const receipt = await transaction.wait(1);
    return `Purchased access with tx hash: ${receipt.transactionHash}`;
  } catch (error) {
    const parsedError = parseContractError(error, datasetMarketPlaceAbi);

    console.error("Error purchasing access:", error);
    return `${failedKey}${parsedError?.name ?? error.message}`;
  }
};

export const canAccess = async (datasetId: number) => {
  try {
    const datasetContract = await getDatasetContract();
    const userAddress = (await getSigner()).address;

    if (!datasetContract) {
      console.error("Failed to get dataset contract");
      return;
    }

    const canAccess = await datasetContract.canAccess(datasetId, userAddress);
    return canAccess;
  } catch (error) {
    console.error("Error checking access:", error);
    return false;
  }
};

export const rethrowFailedResponse = (response: string) => {
  if (String(response).includes(failedKey)) {
    throw new Error(response);
  }
  return response;
};
