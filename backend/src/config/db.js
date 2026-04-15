import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri || mongoUri === "your_mongodb_connection") {
    console.log("MongoDB not configured. Running in in-memory mode.");
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB connection failed. Continuing in in-memory mode.", err.message);
  }
};