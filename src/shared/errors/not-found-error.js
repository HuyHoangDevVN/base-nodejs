"use strict";

const { AppError } = require("../../errors/AppError");

class NotFoundError extends AppError {
  constructor(message, code = "NOT_FOUND", details = undefined) {
    super(message, { status: 404, code, details });
    this.name = "NotFoundError";
  }
}

module.exports = { NotFoundError };
