"use strict";

const { AppError } = require("../../errors/AppError");

class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", code = "UNAUTHORIZED", details = undefined) {
    super(message, { status: 401, code, details });
    this.name = "UnauthorizedError";
  }
}

module.exports = { UnauthorizedError };
