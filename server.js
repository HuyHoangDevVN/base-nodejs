"use strict";

const app = require("./src/app");
const { env } = require("./src/configs/env");
const { connectPostgreSQL } = require("./src/dbs/init.postgre");

let server;

const start = async () => {
  await connectPostgreSQL();
  server = app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
  });
};

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  if (!server) {
    process.exit(0);
  }

  server.close((error) => {
    if (error) {
      console.error("Error during shutdown", error);
      process.exit(1);
    }
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection", error);
  shutdown("unhandledRejection");
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", error);
  shutdown("uncaughtException");
});

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
