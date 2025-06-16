import { Request, Response } from "express";
import AccessGroup from "../models/access-group.model";
import logger from "../config/logger";
import ipAccessModel from "../models/ip-access.model";

export const checkUserAccessToIp = async (req: Request, res: Response) => {
  try {
    const { ipId, userAddress } = req.params;

    const record = await ipAccessModel.findOne({ ipId });
    if (!record || !record.allowedUserAddresses.includes(userAddress)) {
      res.status(403).json({ hasAccess: false });
      return;
    }

    res.status(200).json({ hasAccess: true });
  } catch (err: any) {
    logger.error("Error checking access to IP:", err.message);
    res.status(500).json({ error: "Failed to check access" });
  }
};

export const grantUserAccessToIp = async (req: Request, res: Response) => {
  try {
    const { ipId, userAddress } = req.body;

    const updated = await ipAccessModel.findOneAndUpdate(
      { ipId },
      { $addToSet: { allowedUserAddresses: userAddress } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: "User access granted", data: updated });
  } catch (err: any) {
    logger.error("Error granting access to IP:", err.message);
    res.status(500).json({ error: "Failed to grant access" });
  }
};
