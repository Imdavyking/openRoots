import { secret } from "./secret";

// Load secrets at startup and store them in memory
export const environment = secret.loadAll();
