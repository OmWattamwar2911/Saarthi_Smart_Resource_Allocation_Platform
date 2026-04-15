import mongoose from "mongoose";

const needSchema = new mongoose.Schema({
  title: String,
  location: String,
  category: String,
  urgency: Number,
  people: Number,
  status: { type: String, default: "open" }
}, { timestamps: true });

export default mongoose.model("Need", needSchema);