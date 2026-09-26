import mongoose from "mongoose";

import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (connectionPromise) return connectionPromise;

  mongoose.set("strictQuery", true);

  connectionPromise = mongoose
    .connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 20,
      autoIndex: env.NODE_ENV !== "production",
    })
    .then((instance) => {
      logger.info(
        `Connected to MongoDB database "${env.MONGODB_DB_NAME}" (${instance.connection.host})`,
      );
      return instance;
    })
    .catch((error) => {
      connectionPromise = null;
      logger.error("MongoDB connection failed", error);
      throw error;
    });

  return connectionPromise;
}

export async function disconnectDatabase(): Promise<void> {
  if (!connectionPromise) return;
  connectionPromise = null;
  await mongoose.disconnect();
  logger.info("Disconnected from MongoDB");
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
