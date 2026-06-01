"use strict";

const crypto = require("node:crypto");

const requestId = (req, res, next) => {
  const existingId = req.get("x-request-id");
  req.requestId = existingId || crypto.randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
};

module.exports = { requestId };
