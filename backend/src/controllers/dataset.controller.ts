import { Request, Response } from "express";
import DatasetModel from "../models/dataset.model";
import logger from "../config/logger";

/**
 * Save a dataset to MongoDB
 * @route POST /api/dataset
 */
export const saveDataset = async (req: Request, res: Response) => {
  try {
    const dataset = req.body;

    if (
      !dataset ||
      !dataset.cid ||
      !dataset.creator ||
      !dataset.address ||
      !dataset.groupId
    ) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const saved = await DatasetModel.findOneAndUpdate(
      { cid: dataset.cid },
      dataset,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: "Dataset saved", data: saved });
  } catch (err: any) {
    logger.error("Error saving dataset:", err.message);
    res.status(500).json({ error: "Failed to save dataset" });
  }
};

const queryDatasets = async (filter = {}) => {
  return DatasetModel.find(filter).sort({ createdAt: -1 });
};

/**
 * Get all datasets by creator address
 * @route GET /api/dataset/:address
 */
export const getDatasetsByAddress = async (req: Request, res: Response) => {
  try {
    const address = req.params.address;

    if (!address) {
      res.status(400).json({ error: "address is required" });
      return;
    }

    const datasets = await queryDatasets({ address });

    res.status(200).json(datasets);
  } catch (err: any) {
    logger.error("Error fetching address datasets:", err.message);
    res.status(500).json({ error: "Failed to fetch creataddressor datasets" });
  }
};

/**
 * Get all datasets (no filter)
 * @route GET /api/dataset
 */
export const getAllDatasets = async (_: Request, res: Response) => {
  try {
    const datasets = await queryDatasets();
    res.status(200).json(datasets);
  } catch (err: any) {
    logger.error("Error fetching all datasets:", err.message);
    res.status(500).json({ error: "Failed to fetch datasets" });
  }
};
