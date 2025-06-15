import dotenv from "dotenv";
import { environment } from "../utils/config";
dotenv.config();

export const dbConfig = { url: environment.MONGO_URI! };
