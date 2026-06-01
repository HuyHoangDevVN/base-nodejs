"use strict";

const { AppError } = require("../errors/AppError");

const validate = (schemas) => (req, res, next) => {
  const parsed = {};

  for (const [key, schema] of Object.entries(schemas)) {
    if (!schema) continue;
    const result = schema.safeParse(req[key]);
    if (!result.success) {
      return next(new AppError("Invalid request data", {
        status: 422,
        code: "VALIDATION_ERROR",
        details: result.error.issues,
      }));
    }
    parsed[key] = result.data;
  }

  req.validated = {
    ...(req.validated || {}),
    ...parsed,
  };
  return next();
};

module.exports = { validate };
