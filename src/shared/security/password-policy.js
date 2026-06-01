"use strict";

const { AppError } = require("../../errors/AppError");

const assertPasswordPolicy = (password) => {
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    throw new AppError("Password must be between 8 and 128 characters", {
      status: 422,
      code: "WEAK_PASSWORD",
    });
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new AppError("Password must include letters and numbers", {
      status: 422,
      code: "WEAK_PASSWORD",
    });
  }
};

module.exports = { assertPasswordPolicy };
