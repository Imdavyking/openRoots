

import mongoose from "mongoose";
const DatasetSchema = new mongoose.Schema({
  creator: { type: String, required: true },
  cid: { type: String, required: true },
  createdAt: { type: Number, required: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  preview: { type: String, required: true },
});

const Dataset = mongoose.model("Dataset", DatasetSchema);
export default Dataset;
