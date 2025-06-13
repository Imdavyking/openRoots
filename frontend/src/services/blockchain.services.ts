import {
  BLOCK_EXPLORER_URL,
  CHAIN_ID,
  CHAIN_NAME,
  CHAIN_SYMBOL,
  CURRENCY_NAME,
  DATASET_CONTRACT_ADDRESS,
  RPC_URL,
  SPGNFTContractAddress,
  TOMO_CLIENT_ID,
  WALLET_CONNECT_PROJECT_ID,
} from "../utils/constants";
import { http } from "viem";
import { StoryClient, IpMetadata, StoryConfig } from "@story-protocol/core-sdk";
import { custom, toHex } from "viem";
import { useWalletClient } from "wagmi";
import { BrowserProvider, ethers } from "ethers";
import datasetAbi from "../assets/json/dataset.abi.json";
import { Onboard } from "@tomo-inc/tomo-evm-kit";
import injectedModule from "@web3-onboard/injected-wallets";
import { storyAeneid } from "wagmi/chains";
import { createHash } from "crypto";

const failedKey = "FAILED-";

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
  const injected = injectedModule();

  const chains = [
    {
      id: storyAeneid.id,
      token: storyAeneid.nativeCurrency.symbol,
      label: storyAeneid.name,
      rpcUrl: storyAeneid.rpcUrls.default.http[0],
    },
  ];

  const appMetadata = {
    name: "OpenRoots",
  };

  const onboard = await Onboard({
    wallets: [injected],
    chains,
    appMetadata,
    theme: "default",
    clientId: TOMO_CLIENT_ID,
    projectId: WALLET_CONNECT_PROJECT_ID,
  });

  const wallets = await onboard.connectWallet();
  const currentWallet = wallets[0];
  const walletProvider = currentWallet.provider;
  const provider = new BrowserProvider(walletProvider);
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

// const getStoryClient = async () => {
//   const signer = await getSigner();
//   return StoryClient.newClient({
//     account: signer as any,
//     transport: http(storyAeneid.rpcUrls.default.http[0]),
//     chainId: "aeneid",
//   });
// };

export const saveDatasetCid = async ({
  dataSetUrl,
  creatorName,
  dataHash,
  category,
  preview,
  title,
}: {
  dataSetUrl: string;
  creatorName: string;
  dataHash: string;
  category: number | string;
  preview: string;
  title: string;
}) => {
  // try {
  //   const client = await getStoryClient();
  //   const signer = await getSigner();
  //   const address = (await signer.getAddress()) as `0x${string}`;
  //   const datasetHash = dataHash as `0x${string}`;
  //   const ipMetadata: IpMetadata = client.ipAsset.generateIpMetadata({
  //     title: title,
  //     description: preview,
  //     createdAt: `${Math.trunc(new Date().getTime() / 1000)}`,
  //     creators: [
  //       {
  //         name: creatorName,
  //         address,
  //         contributionPercent: 100,
  //       },
  //     ],
  //     image:
  //       "https://cdn2.suno.ai/image_large_8bcba6bc-3f60-4921-b148-f32a59086a4c.jpeg",
  //     imageHash:
  //       "0xc404730cdcdf7e5e54e8f16bc6687f97c6578a296f4a21b452d8a6ecabd61bcc",
  //     mediaUrl: dataSetUrl,
  //     mediaHash: datasetHash,
  //     mediaType: "text/csv",
  //   });
  //   const nftMetadata = {
  //     name: title,
  //     description: preview,
  //     image:
  //       "https://cdn2.suno.ai/image_large_8bcba6bc-3f60-4921-b148-f32a59086a4c.jpeg",
  //     attributes: [
  //       {
  //         key: "category",
  //         value: category,
  //       },
  //     ],
  //   };
  //   // 3. Upload your IP and NFT Metadata to IPFS
  //   // const ipIpfsHash = await uploadJSONToIPFS(ipMetadata);
  //   // const ipHash = createHash("sha256")
  //   //   .update(JSON.stringify(ipMetadata))
  //   //   .digest("hex");
  //   // const nftIpfsHash = await uploadJSONToIPFS(nftMetadata);
  //   // const nftHash = createHash("sha256")
  //   //   .update(JSON.stringify(nftMetadata))
  //   //   .digest("hex");
  //   // // 4. Register the NFT as an IP Asset
  //   // //
  //   // // Docs: https://docs.story.foundation/sdk-reference/ip-asset#mintandregisterip
  //   // const response = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
  //   //   spgNftContract: SPGNFTContractAddress,
  //   //   licenseTermsData: [
  //   //     {
  //   //       terms: createCommercialRemixTerms({
  //   //         defaultMintingFee: 1,
  //   //         commercialRevShare: 5,
  //   //       }),
  //   //     },
  //   //   ],
  //   //   ipMetadata: {
  //   //     ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
  //   //     ipMetadataHash: `0x${ipHash}`,
  //   //     nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
  //   //     nftMetadataHash: `0x${nftHash}`,
  //   //   },
  //   //   txOptions: { waitForTransaction: true },
  //   // });
  // } catch (error) {
  //   const parsedError = parseContractError(error, datasetMarketPlaceAbi);
  //   console.error("Error saving cid:", error);
  //   return `${failedKey}${parsedError?.name ?? error.message}`;
  // }
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
