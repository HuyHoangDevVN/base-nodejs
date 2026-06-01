"use strict";

const crypto = require("node:crypto");

const hashToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");

const generateOpaqueToken = () => crypto.randomBytes(48).toString("base64url");

const generateTokenFamily = () => crypto.randomUUID();

module.exports = {
  hashToken,
  generateOpaqueToken,
  generateTokenFamily,
};
