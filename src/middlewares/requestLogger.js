"use strict";

const { logger } = require("../shared/logger/logger");

const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level]({
      requestId: req.requestId,
      userId: req.auth?.id,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    }, "http_request");
  });

  next();
};

module.exports = { requestLogger };
