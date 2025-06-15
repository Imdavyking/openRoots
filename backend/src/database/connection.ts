import mongoose from "mongoose";
import logger from "../config/logger";
import { dbConfig } from "../config/database";
export const connectDB = async () => {
  await mongoose.connect(dbConfig.url!);
  logger.info("Database connected!");
};
