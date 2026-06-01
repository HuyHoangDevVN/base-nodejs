"use strict";

const os = require("os");
const process = require("process");
const { logger } = require("../shared/logger/logger");
const _SECONDS = 5000;

// Truyền đối tượng sequelize để lấy thông tin pool
const countConnect = (sequelize) => {
  if (
    !sequelize ||
    !sequelize.connectionManager ||
    !sequelize.connectionManager.pool
  ) {
    logger.warn("Sequelize instance is not available for connection count.");
    return 0;
  }
  const used = sequelize.connectionManager.pool.size;
  logger.info({ connections: used }, "postgres_connection_count");
  return used;
};

const checkOverLoad = (sequelize) => {
  setInterval(() => {
    if (
      !sequelize ||
      !sequelize.connectionManager ||
      !sequelize.connectionManager.pool
    ) {
      logger.warn("Sequelize instance is not available for overload check.");
      return;
    }
    const used = sequelize.connectionManager.pool.size;
    const numCore = os.cpus().length;
    const memoryUsage = process.memoryUsage().rss;
    const maxConnections = numCore * 5;

    logger.info({ connections: used, memoryMb: memoryUsage / 1024 / 1024 }, "postgres_overload_check");

    if (used > maxConnections) {
      logger.warn({ connections: used, maxConnections }, "postgres_connection_overloaded");
      // Notify.send(....)
    }
  }, _SECONDS);
};

module.exports = {
  countConnect,
  checkOverLoad,
};
