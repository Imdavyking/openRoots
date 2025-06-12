import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

export const secret: {
  read: (secretName: string) => string;
  loadAll: () => Record<string, string>;
} = {
  read: (secretName) => {
    try {
      return fs.readFileSync(`/run/secrets/${secretName}`, "utf8").trim();
    } catch (err: any) {
      const fromEnv = process.env[secretName];
      if (fromEnv) {
        return fromEnv;
      }
      console.log(`❌ Missing secret: ${secretName}`);
      return "";
    }
  },

  loadAll: () => {
    const secrets = [
      "NODE_ENV",
      "JWT_SECRET",
      "PORT",
      "FRONTEND_URL",
      "PINATA_JWT",
      "DATASET_CONTRACT_ADDRESS",
      "LIT_PROTOCOL_IDENTIFIER",
      "PRIVATE_KEY",
      "RPC_URL",
      "BLOCKLOCK_SENDER_PROXY",
    ];

    const loadedSecrets: Record<string, string> = {};

    secrets.forEach((secretName) => {
      loadedSecrets[secretName] = secret.read(secretName);
    });

    console.info("✅ All secrets loaded into memory.");
    return loadedSecrets;
  },
};

// Utility to mask secret names in logs
const mask = (name: string) => name.replace(/[a-zA-Z0-9]/g, "*");
