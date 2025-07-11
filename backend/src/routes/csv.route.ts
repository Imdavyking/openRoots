import express from "express";
import { processCSVUpload, upload } from "../controllers/csv.controller";

const csvRoutes = express.Router();
csvRoutes.post("/", upload.single("csvFile"), processCSVUpload);
export default csvRoutes;
