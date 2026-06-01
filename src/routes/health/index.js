"use strict";

const express = require("express");
const db = require("../../models/postgreSQL");
const { asyncHandler } = require("../../middlewares/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../errors/AppError");
const { env } = require("../../configs/env");
const { client } = require("../../shared/metrics/metrics");

const router = express.Router();

router.get("/health", (req, res) =>
  sendSuccess(res, {
    code: "OK",
    message: "Service is healthy",
    data: { uptime: process.uptime() },
  })
);

router.get("/ready", asyncHandler(async (req, res) => {
  try {
    await db.sequelize.authenticate();
    return sendSuccess(res, {
      code: "OK",
      message: "Service is ready",
      data: { database: "ok" },
    });
  } catch {
    throw new AppError("Database is not ready", {
      status: 503,
      code: "SERVICE_NOT_READY",
    });
  }
}));

router.get(["/api/v1/version", "/v1/api/version"], (req, res) =>
  sendSuccess(res, {
    code: "OK",
    message: "Version retrieved",
    data: {
      appName: env.APP_NAME,
      version: env.APP_VERSION,
      commitSha: env.COMMIT_SHA ?? null,
      buildTime: env.BUILD_TIME ?? null,
      nodeEnv: env.NODE_ENV,
    },
  })
);

router.get("/metrics", asyncHandler(async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  return res.send(await client.register.metrics());
}));

module.exports = router;
