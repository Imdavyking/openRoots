import express from "express";
import { processJSONUpload } from "../controllers/json-upload.controllers";

const jsonRoutes = express.Router();
jsonRoutes.post("/", processJSONUpload);
export default jsonRoutes;
