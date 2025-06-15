import mongoose from "mongoose";
const DatasetSchema = new mongoose.Schema({
  creator: { type: String, required: true },
  address: { type: String, required: true },
  cid: { type: String, required: true },
  createdAt: { type: Number, required: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  preview: { type: String, required: true },
  groupId: { type: String, required: true },
  ipId: { type: String, required: true },
});

export default mongoose.model("Dataset", DatasetSchema);
