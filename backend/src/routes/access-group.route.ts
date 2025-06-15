import express from "express";
import {
  addUserToGroup,
  getGroupMembers,
  checkUserAccess,
} from "../controllers/access-group.controller";

const accessGroupRoutes = express.Router();

accessGroupRoutes.post("/add", addUserToGroup); // Add user to group
accessGroupRoutes.get("/:groupId", getGroupMembers); // Get all members of a group
accessGroupRoutes.get("/:groupId/has/:userAddress", checkUserAccess); // Check if user is in group

export default accessGroupRoutes;