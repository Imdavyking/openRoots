import express from "express";
import {
  saveDataset,
  getDatasetsByAddress,
  getAllDatasets,
} from "../controllers/dataset.controller";

const router = express.Router();

router.post("/dataset", saveDataset);
router.get("/dataset", getAllDatasets);
router.get("/dataset/:address", getDatasetsByAddress);

export default router;
