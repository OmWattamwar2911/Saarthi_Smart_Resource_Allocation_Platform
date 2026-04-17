import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

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

let memoryServer = null;

async function connectWithUri(uri, label) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000
  });
  console.log(`MongoDB Connected (${label})`);
  return true;
}

async function startInMemoryMongo(reason = "no MONGO_URI configured") {
  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create();
  }

  const memoryUri = memoryServer.getUri();
  await connectWithUri(memoryUri, `in-memory fallback: ${reason}`);
  return true;
}

export const connectDB = async () => {
  if (isDbConnected()) {
    return true;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri || mongoUri === "your_mongodb_connection") {
    console.log("MongoDB not configured. Starting embedded in-memory MongoDB.");
    try {
      return await startInMemoryMongo("no MONGO_URI configured");
    } catch (err) {
      console.error("Failed to start embedded MongoDB.", err.message);
      return false;
    }
  }

  try {
    return await connectWithUri(mongoUri, "configured URI");
  } catch (err) {
    console.error("MongoDB connection failed. Falling back to embedded in-memory MongoDB.", err.message);
    try {
      return await startInMemoryMongo("configured URI failed");
    } catch (memoryErr) {
      console.error("Failed to start embedded MongoDB fallback.", memoryErr.message);
      return false;
    }
  }
};

export async function closeDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}