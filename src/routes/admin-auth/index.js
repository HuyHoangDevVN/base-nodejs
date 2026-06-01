"use strict";

const express = require("express");
const adminAuthController = require("../../controllers/admin-auth.controller");
const { asyncHandler } = require("../../middlewares/asyncHandler");
const { authenticate, requirePermission } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const {
  assignRolesBody,
  assignGroupPermissionsBody,
  assignPermissionGroupsBody,
  assignRolePermissionGroupsBody,
  assignRolePermissionsBody,
  directPermissionBody,
  groupParams,
  permissionBody,
  permissionGroupBody,
  permissionListQuery,
  permissionParams,
  roleBody,
  roleParams,
  updateStatusBody,
  userListQuery,
  userSessionParams,
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
router.delete("/admin/auth/users/:id/roles/:roleId", authenticate, requirePermission("auth.role.assign"), validate({ params: roleParams }), asyncHandler(adminAuthController.removeUserRole));
router.post("/admin/auth/users/:id/permission-groups", authenticate, requirePermission("auth.permission_group.assign"), validate({ params: uuidParams, body: assignPermissionGroupsBody }), asyncHandler(adminAuthController.assignUserPermissionGroups));
router.delete("/admin/auth/users/:id/permission-groups/:groupId", authenticate, requirePermission("auth.permission_group.assign"), validate({ params: groupParams }), asyncHandler(adminAuthController.removeUserPermissionGroup));
router.post("/admin/auth/users/:id/permissions", authenticate, requirePermission("auth.permission.assign_direct"), validate({ params: uuidParams, body: directPermissionBody }), asyncHandler(adminAuthController.assignUserPermissions));
router.delete("/admin/auth/users/:id/permissions/:permissionId", authenticate, requirePermission("auth.permission.assign_direct"), validate({ params: permissionParams }), asyncHandler(adminAuthController.removeUserPermission));
router.get("/admin/auth/users/:id/sessions", authenticate, requirePermission("auth.session.read"), validate({ params: uuidParams }), asyncHandler(adminAuthController.listUserSessions));
router.delete("/admin/auth/users/:id/sessions/:sessionId", authenticate, requirePermission("auth.session.revoke"), validate({ params: userSessionParams }), asyncHandler(adminAuthController.revokeUserSession));

router.get("/admin/auth/roles", authenticate, requirePermission("auth.role.read"), asyncHandler(adminAuthController.listRoles));
router.post("/admin/auth/roles", authenticate, requirePermission("auth.role.create"), validate({ body: roleBody }), asyncHandler(adminAuthController.createRole));
router.get("/admin/auth/roles/:id", authenticate, requirePermission("auth.role.read"), validate({ params: uuidParams }), asyncHandler(adminAuthController.getRoleById));
router.patch("/admin/auth/roles/:id", authenticate, requirePermission("auth.role.update"), validate({ params: uuidParams, body: roleBody.partial() }), asyncHandler(adminAuthController.updateRole));
router.delete("/admin/auth/roles/:id", authenticate, requirePermission("auth.role.delete"), validate({ params: uuidParams }), asyncHandler(adminAuthController.deleteRole));
router.post("/admin/auth/roles/:id/permission-groups", authenticate, requirePermission("auth.role.update"), validate({ params: uuidParams, body: assignRolePermissionGroupsBody }), asyncHandler(adminAuthController.assignRolePermissionGroups));
router.delete("/admin/auth/roles/:id/permission-groups/:groupId", authenticate, requirePermission("auth.role.update"), validate({ params: groupParams }), asyncHandler(adminAuthController.removeRolePermissionGroup));
router.post("/admin/auth/roles/:id/permissions", authenticate, requirePermission("auth.role.update"), validate({ params: uuidParams, body: assignRolePermissionsBody }), asyncHandler(adminAuthController.assignRolePermissions));
router.delete("/admin/auth/roles/:id/permissions/:permissionId", authenticate, requirePermission("auth.role.update"), validate({ params: permissionParams }), asyncHandler(adminAuthController.removeRolePermission));

router.get("/admin/auth/permissions", authenticate, requirePermission("auth.permission.read"), validate({ query: permissionListQuery }), asyncHandler(adminAuthController.listPermissions));
router.post("/admin/auth/permissions", authenticate, requirePermission("auth.permission.create"), validate({ body: permissionBody }), asyncHandler(adminAuthController.createPermission));
router.get("/admin/auth/permissions/:id", authenticate, requirePermission("auth.permission.read"), validate({ params: uuidParams }), asyncHandler(adminAuthController.getPermissionById));
router.patch("/admin/auth/permissions/:id", authenticate, requirePermission("auth.permission.update"), validate({ params: uuidParams, body: permissionBody.partial() }), asyncHandler(adminAuthController.updatePermission));
router.delete("/admin/auth/permissions/:id", authenticate, requirePermission("auth.permission.delete"), validate({ params: uuidParams }), asyncHandler(adminAuthController.deletePermission));

router.get("/admin/auth/permission-groups", authenticate, requirePermission("auth.permission_group.read"), asyncHandler(adminAuthController.listPermissionGroups));
router.post("/admin/auth/permission-groups", authenticate, requirePermission("auth.permission_group.create"), validate({ body: permissionGroupBody }), asyncHandler(adminAuthController.createPermissionGroup));
router.get("/admin/auth/permission-groups/:id", authenticate, requirePermission("auth.permission_group.read"), validate({ params: uuidParams }), asyncHandler(adminAuthController.getPermissionGroupById));
router.patch("/admin/auth/permission-groups/:id", authenticate, requirePermission("auth.permission_group.update"), validate({ params: uuidParams, body: permissionGroupBody.partial() }), asyncHandler(adminAuthController.updatePermissionGroup));
router.delete("/admin/auth/permission-groups/:id", authenticate, requirePermission("auth.permission_group.delete"), validate({ params: uuidParams }), asyncHandler(adminAuthController.deletePermissionGroup));
router.post("/admin/auth/permission-groups/:id/permissions", authenticate, requirePermission("auth.permission_group.update"), validate({ params: uuidParams, body: assignGroupPermissionsBody }), asyncHandler(adminAuthController.assignGroupPermissions));
router.delete("/admin/auth/permission-groups/:id/permissions/:permissionId", authenticate, requirePermission("auth.permission_group.update"), validate({ params: permissionParams }), asyncHandler(adminAuthController.removeGroupPermission));

module.exports = router;
