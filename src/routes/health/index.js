"use strict";

const express = require("express");
const db = require("../../models/postgreSQL");
const { asyncHandler } = require("../../middlewares/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../errors/AppError");

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
  } catch (error) {
    throw new AppError("Database is not ready", {
      status: 503,
      code: "SERVICE_NOT_READY",
    });
  }
}));

module.exports = router;
