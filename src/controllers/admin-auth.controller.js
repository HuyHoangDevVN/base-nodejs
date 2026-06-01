"use strict";

const crypto = require("node:crypto");
const { authUserRepository, authSessionRepository, passwordService, auditLogService, permissionResolver } = require("../modules/auth");
const { AuthorizationRepository } = require("../modules/authorization/repositories/authorization.repository");
const { sendSuccess } = require("../utils/apiResponse");
const { toPagination } = require("../shared/utils/pagination");
const { toPublicAuthUser } = require("../modules/auth/mappers/auth-user.mapper");
const { AuthAuditAction, AccountStatus } = require("../constants/auth");
const { AppError } = require("../errors/AppError");

const authorizationRepository = new AuthorizationRepository();
const publicEntity = (entity) => (entity?.get ? entity.get({ plain: true }) : entity);

class AdminAuthController {
  getContext = (req) => ({
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  listUsers = async (req, res) => {
    const { count, rows } = await authUserRepository.list(req.validated.query);
    return sendSuccess(res, {
      message: "Auth users retrieved",
      data: {
        items: rows.map(toPublicAuthUser),
        pagination: toPagination({
          page: req.validated.query.page,
          limit: req.validated.query.limit,
          totalItems: count,
        }),
      },
    });
  };

  getUserById = async (req, res) => {
    const user = await authUserRepository.findById(req.validated.params.id, { attributes: { exclude: ["passwordHash"] } });
    if (!user) throw new AppError("Auth user not found", { status: 404, code: "AUTH_USER_NOT_FOUND" });
    return sendSuccess(res, { message: "Auth user retrieved", data: toPublicAuthUser(user) });
  };

  updateUserStatus = async (req, res) => {
    const { id } = req.validated.params;
    const { status, reason } = req.validated.body;
    await authUserRepository.updateById(id, { status });
    await auditLogService.record({
      actorUserId: req.auth.id,
      targetUserId: id,
      action: AuthAuditAction.UPDATE_STATUS,
      resourceType: "auth_user",
      resourceId: id,
      after: { status, reason },
      ...this.getContext(req),
    });
    return sendSuccess(res, { message: "Auth user status updated", data: { id, status } });
  };

  lockUser = async (req, res) => {
    req.validated.body = { status: AccountStatus.LOCKED, reason: "locked_by_admin" };
    return this.updateUserStatus(req, res);
  };

  unlockUser = async (req, res) => {
    req.validated.body = { status: AccountStatus.ACTIVE, reason: "unlocked_by_admin" };
    return this.updateUserStatus(req, res);
  };

  resetPassword = async (req, res) => {
    const newPassword = crypto.randomBytes(12).toString("base64url");
    const passwordHash = await passwordService.hash(`${newPassword}A1`);
    await authUserRepository.updateById(req.validated.params.id, {
      passwordHash,
      mustChangePassword: true,
    });
    await auditLogService.record({
      actorUserId: req.auth.id,
      targetUserId: req.validated.params.id,
      action: AuthAuditAction.CHANGE_PASSWORD,
      resourceType: "auth_user",
      resourceId: req.validated.params.id,
      ...this.getContext(req),
    });
    return sendSuccess(res, {
      message: "Auth user password reset",
      data: { mustChangePassword: true, temporaryPassword: `${newPassword}A1` },
    });
  };

  listRoles = async (req, res) => sendSuccess(res, {
    message: "Roles retrieved",
    data: { items: await authorizationRepository.listRoles() },
  });

  getRoleById = async (req, res) => {
    const role = await authorizationRepository.findRoleById(req.validated.params.id);
    if (!role) throw new AppError("Role not found", { status: 404, code: "ROLE_NOT_FOUND" });
    return sendSuccess(res, { message: "Role retrieved", data: role });
  };

  createRole = async (req, res) => {
    const role = await authorizationRepository.createRole({ ...req.validated.body, isSystem: false, isActive: req.validated.body.isActive ?? true });
    await this.audit("auth.role.create", req, { resourceType: "role", resourceId: role.id, after: publicEntity(role) });
    return sendSuccess(res, { status: 201, code: "CREATED", message: "Role created", data: role });
  };

  updateRole = async (req, res) => {
    const role = await authorizationRepository.findRoleById(req.validated.params.id);
    if (!role) throw new AppError("Role not found", { status: 404, code: "ROLE_NOT_FOUND" });
    const before = publicEntity(role);
    await role.update(req.validated.body);
    await this.audit("auth.role.update", req, { resourceType: "role", resourceId: role.id, before, after: publicEntity(role) });
    return sendSuccess(res, { message: "Role updated", data: role });
  };

  deleteRole = async (req, res) => {
    const role = await authorizationRepository.findRoleById(req.validated.params.id);
    if (!role) throw new AppError("Role not found", { status: 404, code: "ROLE_NOT_FOUND" });
    if (role.isSystem) throw new AppError("System role cannot be deleted", { status: 409, code: "SYSTEM_ROLE_PROTECTED" });
    await role.update({ isActive: false });
    await this.audit("auth.role.delete", req, { resourceType: "role", resourceId: role.id, before: publicEntity(role), after: { isActive: false } });
    return sendSuccess(res, { message: "Role deactivated", data: { id: role.id, isActive: false } });
  };

  listPermissions = async (req, res) => sendSuccess(res, {
    message: "Permissions retrieved",
    data: { items: await authorizationRepository.listPermissions(req.validated?.query ?? {}) },
  });

  getPermissionById = async (req, res) => {
    const permission = await authorizationRepository.findPermissionById(req.validated.params.id);
    if (!permission) throw new AppError("Permission not found", { status: 404, code: "PERMISSION_NOT_FOUND" });
    return sendSuccess(res, { message: "Permission retrieved", data: permission });
  };

  createPermission = async (req, res) => {
    const permission = await authorizationRepository.createPermission({ ...req.validated.body, isSystem: false, isActive: req.validated.body.isActive ?? true });
    await this.audit("auth.permission.create", req, { resourceType: "permission", resourceId: permission.id, after: publicEntity(permission) });
    return sendSuccess(res, { status: 201, code: "CREATED", message: "Permission created", data: permission });
  };

  updatePermission = async (req, res) => {
    const permission = await authorizationRepository.findPermissionById(req.validated.params.id);
    if (!permission) throw new AppError("Permission not found", { status: 404, code: "PERMISSION_NOT_FOUND" });
    if (permission.isSystem) throw new AppError("System permission cannot be modified", { status: 409, code: "SYSTEM_PERMISSION_PROTECTED" });
    const before = publicEntity(permission);
    await permission.update(req.validated.body);
    await this.audit("auth.permission.update", req, { resourceType: "permission", resourceId: permission.id, before, after: publicEntity(permission) });
    return sendSuccess(res, { message: "Permission updated", data: permission });
  };

  deletePermission = async (req, res) => {
    const permission = await authorizationRepository.findPermissionById(req.validated.params.id);
    if (!permission) throw new AppError("Permission not found", { status: 404, code: "PERMISSION_NOT_FOUND" });
    if (permission.isSystem) throw new AppError("System permission cannot be deleted", { status: 409, code: "SYSTEM_PERMISSION_PROTECTED" });
    await permission.update({ isActive: false });
    await this.audit("auth.permission.delete", req, { resourceType: "permission", resourceId: permission.id, before: publicEntity(permission), after: { isActive: false } });
    return sendSuccess(res, { message: "Permission deactivated", data: { id: permission.id, isActive: false } });
  };

  listPermissionGroups = async (req, res) => sendSuccess(res, {
    message: "Permission groups retrieved",
    data: { items: await authorizationRepository.listPermissionGroups() },
  });

  getPermissionGroupById = async (req, res) => {
    const group = await authorizationRepository.findPermissionGroupById(req.validated.params.id);
    if (!group) throw new AppError("Permission group not found", { status: 404, code: "PERMISSION_GROUP_NOT_FOUND" });
    return sendSuccess(res, { message: "Permission group retrieved", data: group });
  };

  createPermissionGroup = async (req, res) => {
    const group = await authorizationRepository.createPermissionGroup({ ...req.validated.body, isActive: req.validated.body.isActive ?? true });
    await this.audit("auth.permission_group.create", req, { resourceType: "permission_group", resourceId: group.id, after: publicEntity(group) });
    return sendSuccess(res, { status: 201, code: "CREATED", message: "Permission group created", data: group });
  };

  updatePermissionGroup = async (req, res) => {
    const group = await authorizationRepository.findPermissionGroupById(req.validated.params.id);
    if (!group) throw new AppError("Permission group not found", { status: 404, code: "PERMISSION_GROUP_NOT_FOUND" });
    const before = publicEntity(group);
    await group.update(req.validated.body);
    await this.audit("auth.permission_group.update", req, { resourceType: "permission_group", resourceId: group.id, before, after: publicEntity(group) });
    return sendSuccess(res, { message: "Permission group updated", data: group });
  };

  deletePermissionGroup = async (req, res) => {
    const group = await authorizationRepository.findPermissionGroupById(req.validated.params.id);
    if (!group) throw new AppError("Permission group not found", { status: 404, code: "PERMISSION_GROUP_NOT_FOUND" });
    await group.update({ isActive: false });
    await this.audit("auth.permission_group.delete", req, { resourceType: "permission_group", resourceId: group.id, before: publicEntity(group), after: { isActive: false } });
    return sendSuccess(res, { message: "Permission group deactivated", data: { id: group.id, isActive: false } });
  };

  assignRoles = async (req, res) => {
    const { id } = req.validated.params;
    const { roleIds, expiresAt, reason } = req.validated.body;
    await authorizationRepository.assignRoles({ userId: id, roleIds, expiresAt, assignedBy: req.auth.id });
    permissionResolver.invalidate(id);
    await auditLogService.record({
      actorUserId: req.auth.id,
      targetUserId: id,
      action: AuthAuditAction.ASSIGN_ROLE,
      resourceType: "auth_user",
      resourceId: id,
      after: { roleIds, expiresAt, reason },
      ...this.getContext(req),
    });
    return sendSuccess(res, { message: "Roles assigned", data: { userId: id, roleIds } });
  };

  removeUserRole = async (req, res) => {
    const { id, roleId } = req.validated.params;
    await authorizationRepository.removeUserRole({ userId: id, roleId });
    permissionResolver.invalidate(id);
    await this.audit("auth.role.remove", req, { targetUserId: id, resourceType: "auth_user", resourceId: id, after: { roleId } });
    return sendSuccess(res, { message: "Role removed", data: { userId: id, roleId } });
  };

  assignUserPermissionGroups = async (req, res) => {
    const { id } = req.validated.params;
    const { groupIds, expiresAt, reason } = req.validated.body;
    await authorizationRepository.assignUserPermissionGroups({ userId: id, groupIds, expiresAt, reason, assignedBy: req.auth.id });
    permissionResolver.invalidate(id);
    await this.audit("auth.permission_group.assign", req, { targetUserId: id, resourceType: "auth_user", resourceId: id, after: { groupIds, expiresAt, reason } });
    return sendSuccess(res, { message: "Permission groups assigned", data: { userId: id, groupIds } });
  };

  removeUserPermissionGroup = async (req, res) => {
    const { id, groupId } = req.validated.params;
    await authorizationRepository.removeUserPermissionGroup({ userId: id, permissionGroupId: groupId });
    permissionResolver.invalidate(id);
    await this.audit("auth.permission_group.remove", req, { targetUserId: id, resourceType: "auth_user", resourceId: id, after: { groupId } });
    return sendSuccess(res, { message: "Permission group removed", data: { userId: id, groupId } });
  };

  assignUserPermissions = async (req, res) => {
    const { id } = req.validated.params;
    const { permissionIds, expiresAt, reason } = req.validated.body;
    await authorizationRepository.assignUserPermissions({ userId: id, permissionIds, expiresAt, reason, assignedBy: req.auth.id });
    permissionResolver.invalidate(id);
    await this.audit("auth.permission.assign_direct", req, { targetUserId: id, resourceType: "auth_user", resourceId: id, after: { permissionIds, expiresAt, reason } });
    return sendSuccess(res, { message: "Direct permissions assigned", data: { userId: id, permissionIds } });
  };

  removeUserPermission = async (req, res) => {
    const { id, permissionId } = req.validated.params;
    await authorizationRepository.removeUserPermission({ userId: id, permissionId });
    permissionResolver.invalidate(id);
    await this.audit("auth.permission.remove_direct", req, { targetUserId: id, resourceType: "auth_user", resourceId: id, after: { permissionId } });
    return sendSuccess(res, { message: "Direct permission removed", data: { userId: id, permissionId } });
  };

  assignGroupPermissions = async (req, res) => {
    const { id } = req.validated.params;
    const { permissionIds } = req.validated.body;
    await authorizationRepository.assignGroupPermissions({ permissionGroupId: id, permissionIds });
    permissionResolver.cache.clear();
    await this.audit("auth.permission_group.update", req, { resourceType: "permission_group", resourceId: id, after: { permissionIds } });
    return sendSuccess(res, { message: "Permissions added to group", data: { permissionGroupId: id, permissionIds } });
  };

  removeGroupPermission = async (req, res) => {
    const { id, permissionId } = req.validated.params;
    await authorizationRepository.removeGroupPermission({ permissionGroupId: id, permissionId });
    permissionResolver.cache.clear();
    await this.audit("auth.permission_group.update", req, { resourceType: "permission_group", resourceId: id, after: { permissionId } });
    return sendSuccess(res, { message: "Permission removed from group", data: { permissionGroupId: id, permissionId } });
  };

  assignRolePermissionGroups = async (req, res) => {
    const { id } = req.validated.params;
    const { groupIds } = req.validated.body;
    await authorizationRepository.assignRolePermissionGroups({ roleId: id, groupIds });
    permissionResolver.cache.clear();
    await this.audit("auth.role.update", req, { resourceType: "role", resourceId: id, after: { groupIds } });
    return sendSuccess(res, { message: "Permission groups added to role", data: { roleId: id, groupIds } });
  };

  removeRolePermissionGroup = async (req, res) => {
    const { id, groupId } = req.validated.params;
    await authorizationRepository.removeRolePermissionGroup({ roleId: id, permissionGroupId: groupId });
    permissionResolver.cache.clear();
    await this.audit("auth.role.update", req, { resourceType: "role", resourceId: id, after: { groupId } });
    return sendSuccess(res, { message: "Permission group removed from role", data: { roleId: id, groupId } });
  };

  assignRolePermissions = async (req, res) => {
    const { id } = req.validated.params;
    const { permissionIds } = req.validated.body;
    await authorizationRepository.assignRolePermissions({ roleId: id, permissionIds });
    permissionResolver.cache.clear();
    await this.audit("auth.role.update", req, { resourceType: "role", resourceId: id, after: { permissionIds } });
    return sendSuccess(res, { message: "Permissions added to role", data: { roleId: id, permissionIds } });
  };

  removeRolePermission = async (req, res) => {
    const { id, permissionId } = req.validated.params;
    await authorizationRepository.removeRolePermission({ roleId: id, permissionId });
    permissionResolver.cache.clear();
    await this.audit("auth.role.update", req, { resourceType: "role", resourceId: id, after: { permissionId } });
    return sendSuccess(res, { message: "Permission removed from role", data: { roleId: id, permissionId } });
  };

  listUserSessions = async (req, res) => {
    const userId = req.validated.params.id;
    const sessions = await authSessionRepository.AuthSession.findAll({
      where: { userId },
      attributes: { exclude: ["refreshTokenHash"] },
      order: [["created_at", "DESC"]],
    });
    return sendSuccess(res, { message: "User sessions retrieved", data: { items: sessions } });
  };

  revokeUserSession = async (req, res) => {
    const session = await authSessionRepository.findActiveById(req.validated.params.sessionId);
    if (!session || session.userId !== req.validated.params.id) throw new AppError("Session not found", { status: 404, code: "SESSION_NOT_FOUND" });
    await authSessionRepository.revoke(session, "admin_revoke");
    await this.audit("auth.session.revoke", req, { targetUserId: session.userId, resourceType: "auth_session", resourceId: session.id });
    return sendSuccess(res, { message: "Session revoked", data: { id: session.id } });
  };

  audit = (action, req, event) => auditLogService.record({
    actorUserId: req.auth?.id,
    targetUserId: event.targetUserId ?? null,
    action,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    before: event.before,
    after: event.after,
    ...this.getContext(req),
  });
}

module.exports = new AdminAuthController();
