import express from "express";
import { getSessionSigs } from "../controllers/lit.session.controllers";

const litRoutes = express.Router();
litRoutes.post("/", getSessionSigs);
export default litRoutes;
