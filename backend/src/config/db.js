import mongoose from "mongoose";

const STATE_MAP = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting"
};

export function getDbStatus() {
  return STATE_MAP[mongoose.connection.readyState] || "unknown";
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri || mongoUri === "your_mongodb_connection") {
    console.log("MongoDB not configured. Running in in-memory mode.");
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log("MongoDB Connected");
    return true;
  } catch (err) {
    console.error("MongoDB connection failed. Continuing in in-memory mode.", err.message);
    return false;
  }
};