import mongoose from "mongoose";

const AccessGroupSchema = new mongoose.Schema(
  {
    groupId: { type: String, required: true, unique: true },
    userAddresses: { type: [String], required: true, default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("AccessGroup", AccessGroupSchema);
