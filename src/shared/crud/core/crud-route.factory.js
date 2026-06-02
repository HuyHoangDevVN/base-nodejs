"use strict";

const express = require("express");
const { requireAuth, requireAllPermissions, requireAnyPermission, requirePermission } = require("../../../middlewares/auth");
const { asyncHandler } = require("../../../middlewares/asyncHandler");
const { createCrudController } = require("./crud-controller.factory");
const { normalizeCrudResourceConfig } = require("./crud-resource.config");

const permissionMiddleware = (permission) => {
  if (!permission) return (_req, _res, next) => next();
  if (typeof permission === "string") return requirePermission(permission);
  if (Array.isArray(permission)) return requireAnyPermission(permission);
  if (permission.any) return requireAnyPermission(permission.any);
  if (permission.all) return requireAllPermissions(permission.all);
  return (_req, _res, next) => next();
};

const authMiddlewares = (config, action) => {
  if (config.public === true && !config.permissions?.[action]) return [];
  return [requireAuth, permissionMiddleware(config.permissions?.[action])];
};

const createCrudRoutes = (rawConfig, options = {}) => {
  const config = normalizeCrudResourceConfig(rawConfig);
  const router = express.Router();
  const controller = createCrudController(config, options);
  const route = (method, path, action, handler) => {
    if (!config.actions[action]) return;
    router[method](path, ...authMiddlewares(config, action), asyncHandler(handler));
  };

  route("get", "/select", "select", controller.getSelect);
  route("get", "/", "list", controller.getList);
  route("get", "/:id", "detail", controller.getDetail);
  route("post", "/", "create", controller.createOne);
  route("post", "/bulk", "bulkCreate", controller.createList);
  route("patch", "/bulk", "bulkUpdate", controller.updateList);
  route("patch", "/:id", "update", controller.updateOne);
  route("delete", "/bulk", "bulkDelete", controller.deleteList);
  route("delete", "/:id", "delete", controller.deleteOne);
  route("post", "/bulk/restore", "bulkRestore", controller.restoreList);
  route("post", "/:id/restore", "restore", controller.restoreOne);

  return router;
};

module.exports = {
  createCrudRoutes,
};
