"use strict";

const pino = require("pino");
const { env } = require("../../configs/env");

const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  "headers.authorization",
  "headers.cookie",
  "*.password",
  "*.oldPassword",
  "*.newPassword",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
  "*.secret",
  "body.password",
  "body.oldPassword",
  "body.newPassword",
  "body.accessToken",
  "body.refreshToken",
];

const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    app: env.APP_NAME,
    env: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: redactPaths,
    censor: "[REDACTED]",
  },
});

module.exports = { logger, redactPaths };
