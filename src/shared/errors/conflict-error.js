"use strict";

const { AppError } = require("../../errors/AppError");

class ConflictError extends AppError {
  constructor(message, code = "CONFLICT", details = undefined) {
    super(message, { status: 409, code, details });
    this.name = "ConflictError";
  }
}

module.exports = { ConflictError };
