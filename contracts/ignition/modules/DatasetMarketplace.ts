// ignition/modules/DatasetMarketplaceModule.ts

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import dotenv from "dotenv";

dotenv.config();

const DatasetMarketplaceModule = buildModule(
  "DatasetMarketplaceModule",
  (m) => {
    const datasetMarketplace = m.contract("DatasetMarketplace", [
      process.env.BLOCKLOCK_SENDER_PROXY!,
    ]);

    return { datasetMarketplace };
  }
);

export default DatasetMarketplaceModule;
