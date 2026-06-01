"use strict";

const jwt = require("jsonwebtoken");
const { env } = require("../configs/env");
const { AppError } = require("../errors/AppError");

const authenticate = (req, res, next) => {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Authentication required", {
      status: 401,
      code: "UNAUTHORIZED",
    }));
  }

  try {
    req.user = jwt.verify(token, env.JWT_ACCESS_SECRET);
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", {
      status: 401,
      code: "INVALID_TOKEN",
    }));
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", {
      status: 401,
      code: "UNAUTHORIZED",
    }));
  }

  if (roles.length > 0 && !roles.includes(req.user.role)) {
    return next(new AppError("Insufficient permissions", {
      status: 403,
      code: "FORBIDDEN",
    }));
  }

  return next();
};

const optionalReadAuth = (req, res, next) => {
  if (!env.API_REQUIRE_AUTH_FOR_READS_BOOL) {
    return next();
  }
  return authenticate(req, res, next);
};

module.exports = { authenticate, authorize, optionalReadAuth };
