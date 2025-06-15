import express from "express";
import {
  saveDataset,
  getDatasetsByAddress,
  getAllDatasets,
} from "../controllers/dataset.controller";

const datasetRoutes = express.Router();

datasetRoutes.post("/", saveDataset);
datasetRoutes.get("/", getAllDatasets);
datasetRoutes.get("/:address", getDatasetsByAddress);

export default datasetRoutes;
