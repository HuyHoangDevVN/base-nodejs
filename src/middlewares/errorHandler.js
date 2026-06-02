"use strict";

const { ZodError } = require("zod");
const { AppError } = require("../errors/AppError");
const { logger } = require("../shared/logger/logger");

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, {
    status: 404,
    code: "NOT_FOUND",
    details: { path: req.originalUrl },
  }));
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const isProduction = process.env.NODE_ENV === "production";
  const status = err.status || (err instanceof ZodError ? 422 : 500);
  const code = err.code || (err instanceof ZodError ? "VALIDATION_ERROR" : "INTERNAL_ERROR");
  const message = status >= 500 && isProduction ? "Internal server error" : err.message;
  const details = err instanceof ZodError ? err.issues : err.details;

  if (status >= 500) {
    logger.error({
      requestId: req.requestId,
      userId: req.auth?.id,
      method: req.method,
      path: req.originalUrl,
      code,
      message: err.message,
      stack: isProduction ? undefined : err.stack,
    }, "request_error");
  }

  return res.status(status).json({
    success: false,
    code,
    message,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    ...(details ? { details } : {}),
    meta: {
      requestId: req.requestId,
    },
    requestId: req.requestId,
  });
};

module.exports = { notFoundHandler, errorHandler };
