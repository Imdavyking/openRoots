import express from "express";
import {
  checkUserAccessToIp,
  grantUserAccessToIp,
} from "../controllers/ip-access.controller";

const router = express.Router();

router.get("/ip/has/:ipId/:userAddress", checkUserAccessToIp);
router.post("/ip/grant", grantUserAccessToIp);

export default router;
