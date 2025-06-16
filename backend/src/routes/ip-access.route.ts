import express from "express";
import {
  checkUserAccessToIp,
  grantUserAccessToIp,
} from "../controllers/ip-access.controller";

const ipAccessRoutes = express.Router();

ipAccessRoutes.get("/ip/:ipId/has/:userAddress", checkUserAccessToIp);
ipAccessRoutes.post("/ip/grant", grantUserAccessToIp);

export default ipAccessRoutes;
