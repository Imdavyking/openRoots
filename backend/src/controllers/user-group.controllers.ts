import { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import UserGroup from "../models/user-group.model";
import logger from "../config/logger";

dotenv.config();

/**
 * GET /api/user-group?address=...
 * Retrieves the groupId for a given user address.
 */
export const getUserGroup = async (req: Request, res: Response) => {
  try {
    const { address } = req.query;

    if (!address || typeof address !== "string") {
      res.status(400).json({ error: "Invalid address" });
      return;
    }

    const userGroup = await UserGroup.findOne({
      address: address.toLowerCase(),
    });

    if (!userGroup) {
      res.status(404).json({ groupId: null });
      return;
    }

    res.status(200).json({ groupId: userGroup.groupId });
    return;
  } catch (error) {
    logger.error(`Error fetching user group: ${error}`);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

/**
 * POST /api/user-group
 * Saves or updates the groupId for a given user address.
 */
export const saveUserGroup = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { address, groupId } = req.body;

    if (!address || !groupId) {
      await session.abortTransaction();
      res.status(400).json({ error: "Address and groupId are required" });
      return;
    }

    await UserGroup.findOneAndUpdate(
      { address: address.toLowerCase() },
      { groupId },
      { upsert: true, new: true, session }
    );

    await session.commitTransaction();
    res.status(200).json({ success: true });
    return;
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error saving user group: ${error}`);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  } finally {
    session.endSession();
  }
};
