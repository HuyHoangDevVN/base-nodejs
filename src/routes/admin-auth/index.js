"use strict";

const express = require("express");
const adminAuthController = require("../../controllers/admin-auth.controller");
const { asyncHandler } = require("../../middlewares/asyncHandler");
const { authenticate, requirePermission } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const {
  assignRolesBody,
  updateStatusBody,
  userListQuery,
  uuidParams,
} = require("../../validators/admin-auth.validator");

const router = express.Router();

router.get("/admin/auth/users", authenticate, requirePermission("auth.user.read"), validate({ query: userListQuery }), asyncHandler(adminAuthController.listUsers));
router.get("/admin/auth/users/:id", authenticate, requirePermission("auth.user.read"), validate({ params: uuidParams }), asyncHandler(adminAuthController.getUserById));
router.patch("/admin/auth/users/:id/status", authenticate, requirePermission("auth.user.update_status"), validate({ params: uuidParams, body: updateStatusBody }), asyncHandler(adminAuthController.updateUserStatus));
router.post("/admin/auth/users/:id/lock", authenticate, requirePermission("auth.user.lock"), validate({ params: uuidParams }), asyncHandler(adminAuthController.lockUser));
router.post("/admin/auth/users/:id/unlock", authenticate, requirePermission("auth.user.unlock"), validate({ params: uuidParams }), asyncHandler(adminAuthController.unlockUser));
router.post("/admin/auth/users/:id/reset-password", authenticate, requirePermission("auth.user.reset_password"), validate({ params: uuidParams }), asyncHandler(adminAuthController.resetPassword));
router.post("/admin/auth/users/:id/roles", authenticate, requirePermission("auth.role.assign"), validate({ params: uuidParams, body: assignRolesBody }), asyncHandler(adminAuthController.assignRoles));

router.get("/admin/auth/roles", authenticate, requirePermission("auth.role.read"), asyncHandler(adminAuthController.listRoles));
router.get("/admin/auth/permissions", authenticate, requirePermission("auth.permission.read"), asyncHandler(adminAuthController.listPermissions));
router.get("/admin/auth/permission-groups", authenticate, requirePermission("auth.permission_group.read"), asyncHandler(adminAuthController.listPermissionGroups));

module.exports = router;
