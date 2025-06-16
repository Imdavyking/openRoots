import { Request, Response } from "express";
import AccessGroup from "../models/access-group.model";
import logger from "../config/logger";
/**
 * Add an address to a group
 * @route POST /api/group/add
 * @body { groupId: string, userAddress: string }
 */
export const addUserToGroup = async (req: Request, res: Response) => {
  try {
    const { groupId, userAddress } = req.body;
    if (!groupId || !userAddress) {
      res.status(400).json({ error: "groupId and userAddress are required" });
      return;
    }

    const updated = await AccessGroup.findOneAndUpdate(
      { groupId },
      { $addToSet: { userAddresses: userAddress } }, // prevent duplicates
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: "User added to group", data: updated });
  } catch (err: any) {
    logger.error("Error adding user to group:", err.message);
    res.status(500).json({ error: "Failed to add user to group" });
  }
};

/**
 * Get all addresses in a group
 * @route GET /api/group/:groupId
 */
export const getGroupMembers = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const group = await AccessGroup.findOne({ groupId });

    if (!group) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    res.status(200).json({ userAddresses: group.userAddresses });
  } catch (err: any) {
    logger.error("Error getting group members:", err.message);
    res.status(500).json({ error: "Failed to fetch group members" });
  }
};

// `/api/access-group/ip/${dataset.ipId}/has/${wallet.account.address}`
/**
 * Check if an address has access to a dataset IP
 * @route GET /api/access-group/ip/:ipId/has/:userAddress
 */


/**
 * Check if an address has access to a group
 * @route GET /api/group/:groupId/has/:userAddress
 */
export const checkUserAccess = async (req: Request, res: Response) => {
  try {
    const { groupId, userAddress } = req.params;

    const group = await AccessGroup.findOne({ groupId });

    if (!group || !group.userAddresses.includes(userAddress)) {
      res.status(403).json({ hasAccess: false });
      return;
    }

    res.status(200).json({ hasAccess: true });
  } catch (err: any) {
    logger.error("Error checking access:", err.message);
    res.status(500).json({ error: "Failed to check access" });
  }
};
