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

function isMd5Failure(error) {
  return /MD5 check failed/i.test(String(error?.message || ""));
}

async function connectWithUri(uri, label) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000
  });
  console.log(`MongoDB Connected (${label})`);
  return true;
}

async function startInMemoryMongo(reason = "no MONGO_URI configured") {
  if (!memoryServer) {
    try {
      memoryServer = await MongoMemoryServer.create();
    } catch (error) {
      if (!isMd5Failure(error)) {
        throw error;
      }

      // In local development, cached mongodb-memory-server downloads can become corrupted.
      // Retry once with MD5 verification disabled so the server can still boot.
      console.warn("MongoDB in-memory binary checksum mismatch. Retrying with MD5 check disabled.");
      process.env.MONGOMS_MD5_CHECK = "0";
      memoryServer = await MongoMemoryServer.create({
        binary: { checkMD5: false }
      });
    }
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