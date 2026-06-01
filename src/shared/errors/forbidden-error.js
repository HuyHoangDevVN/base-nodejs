"use strict";

const { AppError } = require("../../errors/AppError");

class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions", code = "FORBIDDEN", details = undefined) {
    super(message, { status: 403, code, details });
    this.name = "ForbiddenError";
  }
}

module.exports = { ForbiddenError };
