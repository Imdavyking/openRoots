import mongoose from "mongoose";

const IpAccessSchema = new mongoose.Schema(
  {
    ipId: { type: String, required: true, unique: true },
    allowedUserAddresses: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("IpAccess", IpAccessSchema);
