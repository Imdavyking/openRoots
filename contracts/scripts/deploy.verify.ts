import DatasetMarketplaceDeployer from "../ignition/modules/DatasetMarketplace";
import hre, { network } from "hardhat";
import { verify } from "./verify.deploy";
import { cleanDeployments } from "../utils/clean";
import { localHardhat } from "../utils/localhardhat.chainid";
import { updateEnv } from "../utils/update.env";
import { copyABI } from "../utils/copy.abi";

async function main() {
  const chainId = network.config.chainId!;

  cleanDeployments(chainId!);
  const { datasetMarketplace } = await hre.ignition.deploy(
    DatasetMarketplaceDeployer
  );
  await datasetMarketplace.waitForDeployment();
  const datasetMarketplaceAddress = await datasetMarketplace.getAddress();
  console.log(
    `DatasetMarketplace deployed to ${datasetMarketplaceAddress} on ${hre.network.name}`
  );
  await verify(datasetMarketplaceAddress, []);
  if (typeof chainId !== "undefined" && localHardhat.includes(chainId)) return;

  const blockNumber = await hre.ethers.provider.getBlockNumber();
  const rpcUrl = (network.config as any).url;
  const blockExplorerUrl = network.config.ignition.explorerUrl!;
  const chainName = process.env.CHAIN_NAME!;
  const chainCurrencyName = process.env.CHAIN_CURRENCY_NAME!;
  const chainSymbol = process.env.CHAIN_SYMBOL!;

  /**
   * Frontend
   */
  // .envs
  updateEnv(rpcUrl, "frontend", "VITE_RPC_URL");
  updateEnv(chainId!.toString()!, "frontend", "VITE_CHAIN_ID");
  updateEnv(blockExplorerUrl, "frontend", "VITE_CHAIN_BLOCKEXPLORER_URL");
  updateEnv(chainName, "frontend", "VITE_CHAIN_NAME");
  updateEnv(chainCurrencyName, "frontend", "VITE_CHAIN_CURRENCY_NAME");
  updateEnv(chainSymbol, "frontend", "VITE_CHAIN_SYMBOL");
  updateEnv(
    datasetMarketplaceAddress,
    "frontend",
    "VITE_DATASET_CONTRACT_ADDRESS"
  );

  // abis
  copyABI("DatasetMarketplace", "frontend/src/assets/json", "dataset.abi");

  /**
   * Backend
   */
  // .envs
  updateEnv(datasetMarketplaceAddress, "backend", "DATASET_CONTRACT_ADDRESS");
}

main().catch(console.error);
