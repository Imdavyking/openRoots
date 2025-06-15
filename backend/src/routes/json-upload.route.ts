import express from "express";
import { processJSONUpload } from "../controllers/json-upload.controller";

const jsonRoutes = express.Router();
jsonRoutes.post("/", processJSONUpload);
export default jsonRoutes;
