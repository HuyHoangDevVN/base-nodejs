"use strict";

const { AppError } = require("../errors/AppError");
const { env } = require("../configs/env");
const { tokenService, permissionResolver } = require("../modules/auth");

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
    const payload = tokenService.verifyAccessToken(token);
    req.auth = {
      id: payload.authUserId ?? payload.sub,
      userId: payload.authUserId ?? payload.sub,
      sessionId: payload.sessionId,
      roles: payload.roles ?? (payload.role ? [payload.role] : []),
      tokenVersion: payload.tokenVersion,
      jti: payload.jti,
    };
    req.user = {
      ...payload,
      id: req.auth.id,
      role: payload.role ?? (req.auth.roles.includes("SUPER_ADMIN") || req.auth.roles.includes("ADMIN") ? "admin" : "user"),
    };
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", {
      status: 401,
      code: "INVALID_TOKEN",
    }));
  }
};

const requireAuth = authenticate;

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

const requireRole = (roles) => authorize(...roles);

const requirePermission = (permissionCode) => async (req, res, next) => {
  try {
    if (!req.auth) {
      return next(new AppError("Authentication required", { status: 401, code: "UNAUTHORIZED" }));
    }
    if (req.auth.roles?.includes("SUPER_ADMIN")) return next();
    const allowed = await permissionResolver.hasPermission(req.auth.id, permissionCode);
    if (!allowed) {
      return next(new AppError("Insufficient permissions", { status: 403, code: "FORBIDDEN" }));
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireAnyPermission = (permissionCodes) => async (req, res, next) => {
  try {
    if (!req.auth) return next(new AppError("Authentication required", { status: 401, code: "UNAUTHORIZED" }));
    if (req.auth.roles?.includes("SUPER_ADMIN")) return next();
    const checks = await Promise.all(permissionCodes.map((code) => permissionResolver.hasPermission(req.auth.id, code)));
    if (!checks.some(Boolean)) {
      return next(new AppError("Insufficient permissions", { status: 403, code: "FORBIDDEN" }));
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireAllPermissions = (permissionCodes) => async (req, res, next) => {
  try {
    if (!req.auth) return next(new AppError("Authentication required", { status: 401, code: "UNAUTHORIZED" }));
    if (req.auth.roles?.includes("SUPER_ADMIN")) return next();
    const checks = await Promise.all(permissionCodes.map((code) => permissionResolver.hasPermission(req.auth.id, code)));
    if (!checks.every(Boolean)) {
      return next(new AppError("Insufficient permissions", { status: 403, code: "FORBIDDEN" }));
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireSelfOrPermission = (getTargetUserId, permissionCode) => async (req, res, next) => {
  const targetUserId = getTargetUserId(req);
  if (req.auth?.id && String(req.auth.id) === String(targetUserId)) return next();
  return requirePermission(permissionCode)(req, res, next);
};

const optionalReadAuth = (req, res, next) => {
  if (!env.API_REQUIRE_AUTH_FOR_READS_BOOL) {
    return next();
  }
  return authenticate(req, res, next);
};

module.exports = {
  authenticate,
  authorize,
  optionalReadAuth,
  requireAuth,
  requireRole,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireSelfOrPermission,
};
