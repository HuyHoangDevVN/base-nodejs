"use strict";

const app = require("./src/app");
const { env } = require("./src/configs/env");
const { connectPostgreSQL } = require("./src/dbs/init.postgre");
const { logger } = require("./src/shared/logger/logger");

let server;

const start = async () => {
  await connectPostgreSQL();
  server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "server_started");
  });
};

const shutdown = (signal) => {
  logger.info({ signal }, "server_shutdown_started");
  if (!server) {
    process.exit(0);
  }

  server.close((error) => {
    if (error) {
      logger.error({ error: error.message }, "server_shutdown_failed");
      process.exit(1);
    }
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (error) => {
  logger.error({ error: error.message }, "unhandled_rejection");
  shutdown("unhandledRejection");
});
process.on("uncaughtException", (error) => {
  logger.error({ error: error.message }, "uncaught_exception");
  shutdown("uncaughtException");
});

start().catch((error) => {
  logger.error({ error: error.message }, "server_start_failed");
  process.exit(1);
});
