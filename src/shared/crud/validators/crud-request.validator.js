"use strict";

const { z } = require("zod");
const { validationError } = require("../core/crud-errors");

const pickAllowed = (payload, allowedFields, { rejectUnknownFields = true } = {}) => {
  const allowed = new Set(allowedFields);
  const unknown = Object.keys(payload ?? {}).filter((field) => !allowed.has(field));
  if (unknown.length && rejectUnknownFields) {
    throw validationError("Payload contains fields that are not allowed", unknown.map((field) => ({
      path: [field],
      message: "Field is not writable for this action",
    })));
  }
  return Object.fromEntries(Object.entries(payload ?? {}).filter(([field]) => allowed.has(field)));
};

const parseWithSchema = (schema, payload) => {
  if (!schema) return payload;
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw validationError("Validation failed", result.error.issues);
  }
  return result.data;
};

const validateCreatePayload = (config, payload) => {
  const whitelisted = pickAllowed(payload, config.fields.create, config.validation);
  return parseWithSchema(config.validation.createSchema, whitelisted);
};

const validateUpdatePayload = (config, payload) => {
  const whitelisted = pickAllowed(payload, config.fields.update, config.validation);
  return parseWithSchema(config.validation.updateSchema, whitelisted);
};

const validateId = (config, id) => {
  const idType = config.storage.idType ?? "string";
  if (idType === "integer") {
    const parsed = Number.parseInt(id, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) throw validationError("Invalid id", [{ path: ["id"], message: "id must be a positive integer" }]);
    return parsed;
  }
  if (idType === "uuid") {
    return z.string().uuid().parse(id);
  }
  if (idType === "objectId" && !/^[a-f\d]{24}$/i.test(String(id))) {
    throw validationError("Invalid id", [{ path: ["id"], message: "id must be a valid ObjectId" }]);
  }
  return String(id);
};

module.exports = {
  pickAllowed,
  validateCreatePayload,
  validateId,
  validateUpdatePayload,
};
