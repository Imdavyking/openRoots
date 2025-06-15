import express from "express";
import {
  saveDataset,
  getDatasetsByCreator,
  getAllDatasets,
} from "../controllers/dataset.controller";

const router = express.Router();

router.post("/dataset", saveDataset);
router.get("/dataset", getAllDatasets);
router.get("/dataset/:creator", getDatasetsByCreator);

export default router;
