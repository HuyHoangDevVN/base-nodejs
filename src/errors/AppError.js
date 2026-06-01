"use strict";

class AppError extends Error {
  constructor(message, { status = 500, code = "INTERNAL_ERROR", details = undefined } = {}) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

module.exports = { AppError };
