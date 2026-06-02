"use strict";

const { validationError } = require("../core/crud-errors");
const { validateCreatePayload, validateId, validateUpdatePayload } = require("./crud-request.validator");

const ensureBulkLimit = (config, items, path = ["body"]) => {
  if (!Array.isArray(items)) {
    throw validationError("Bulk payload must be an array", [{ path, message: "Expected array" }]);
  }
  if (items.length === 0) {
    throw validationError("Bulk payload cannot be empty", [{ path, message: "Expected at least one item" }]);
  }
  if (items.length > config.limits.maxBulkSize) {
    throw validationError("Bulk payload exceeds maxBulkSize", [{ path, message: `Max ${config.limits.maxBulkSize} items` }]);
  }
};

const validateBulkCreatePayload = (config, items) => {
  ensureBulkLimit(config, items, ["items"]);
  return items.map((item, index) => {
    try {
      return validateCreatePayload(config, item);
    } catch (error) {
      throw validationError("Bulk create validation failed", [{ index, issues: error.details ?? error.message }]);
    }
  });
};

const validateBulkUpdatePayload = (config, items) => {
  ensureBulkLimit(config, items, ["items"]);
  return items.map((item, index) => {
    try {
      return {
        id: validateId(config, item?.id),
        patch: validateUpdatePayload(config, item?.data ?? item?.patch ?? {}),
      };
    } catch (error) {
      throw validationError("Bulk update validation failed", [{ index, issues: error.details ?? error.message }]);
    }
  });
};

const validateBulkIdsPayload = (config, ids) => {
  ensureBulkLimit(config, ids, ["ids"]);
  return ids.map((id, index) => {
    try {
      return validateId(config, id);
    } catch (error) {
      throw validationError("Bulk id validation failed", [{ index, issues: error.details ?? error.message }]);
    }
  });
};

module.exports = {
  ensureBulkLimit,
  validateBulkCreatePayload,
  validateBulkIdsPayload,
  validateBulkUpdatePayload,
};
