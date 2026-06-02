"use strict";

const { AppError } = require("../../../errors/AppError");

class CrudError extends AppError {
  constructor(message, { status = 400, code = "CRUD_ERROR", details } = {}) {
    super(message, { status, code, details });
  }
}

const badRequest = (message, details) => new CrudError(message, { status: 400, code: "BAD_REQUEST", details });
const validationError = (message, details) => new CrudError(message, { status: 422, code: "VALIDATION_ERROR", details });
const forbidden = (message = "Insufficient permissions") => new CrudError(message, { status: 403, code: "FORBIDDEN" });
const notFound = (resource, id) => new CrudError(`${resource} not found`, { status: 404, code: "RESOURCE_NOT_FOUND", details: { id } });
const actionDisabled = (action) => new CrudError(`Action ${action} is disabled`, { status: 404, code: "ACTION_DISABLED" });

module.exports = {
  CrudError,
  actionDisabled,
  badRequest,
  forbidden,
  notFound,
  validationError,
};
