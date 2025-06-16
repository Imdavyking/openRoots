import express from "express";
import {
  checkUserAccessToIp,
  grantUserAccessToIp,
} from "../controllers/ip-access.controller";

const router = express.Router();

router.get("/access-group/ip/has/:ipId/:userAddress", checkUserAccessToIp);
router.post("/access-group/ip/grant", grantUserAccessToIp);

export default router;
