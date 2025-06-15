import express from "express";
import {
  getUserGroup,
  saveUserGroup,
} from "../controllers/user-group.controller";

const userGroupRoutes = express.Router();

userGroupRoutes.get("/", getUserGroup);
userGroupRoutes.post("/", saveUserGroup);

export default userGroupRoutes;
