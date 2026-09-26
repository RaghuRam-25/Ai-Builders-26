import { createServer } from "node:http";

import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

async function main() {
  await connectDatabase();

  const app = createApp();
  const server = createServer(app);

  server.listen(env.PORT, env.HOST, () => {
    logger.info(
      `Janasheba API listening on http://${env.HOST}:${env.PORT}/api/v1`,
      { env: env.NODE_ENV, corsOrigins: env.corsOrigins },
    );
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection", reason);
  });
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception", error);
    process.exit(1);
  });
}

main().catch((error: unknown) => {
  logger.error("Failed to start the Janasheba API", error);
  process.exit(1);
});
