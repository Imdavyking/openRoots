import { run, network } from "hardhat";
import { localHardhat } from "../utils/localhardhat.chainid";

export const verify = async (
  contractAddress: any,
  args: any,
  contract: string | null = null
) => {
  try {
    const chainId = network.config.chainId;

    if (typeof chainId !== "undefined" && localHardhat.includes(chainId))
      return;
    const verifyArgs: any = {
      address: contractAddress,
      constructorArguments: args,
    };
    if (contract) {
      verifyArgs["contract"] = contract;
    }
    await run("verify:verify", verifyArgs);
  } catch (e: any) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(e.message);
    }
  }
};

module.exports = { verify };
