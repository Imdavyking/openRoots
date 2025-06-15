import mongoose from "mongoose";

const UserGroupSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    groupId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("UserGroup", UserGroupSchema);
