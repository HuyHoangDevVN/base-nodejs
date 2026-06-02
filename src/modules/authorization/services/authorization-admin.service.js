"use strict";

const db = require("../../../models/postgreSQL");
const { AppError } = require("../../../errors/AppError");
const { AuthAuditAction } = require("../../../constants/auth");

class AuthorizationAdminService {
  constructor({ models = db, permissionResolver } = {}) {
    this.models = models;
    this.permissionResolver = permissionResolver;
  }

  async transaction(work) {
    return this.models.sequelize.transaction(work);
  }

  async audit(transaction, ctx, event) {
    return this.models.AuthAuditLog.create({
      actorUserId: ctx.actorUserId,
      targetUserId: event.targetUserId ?? null,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId ?? null,
      beforeJson: event.before ?? null,
      afterJson: event.after ?? null,
      ipAddress: ctx.ipAddress ?? null,
      userAgent: ctx.userAgent ?? null,
      requestId: ctx.requestId ?? null,
    }, { transaction });
  }

  async assignRoles({ userId, roleIds, expiresAt, reason, ctx }) {
    await this.transaction(async (transaction) => {
      for (const roleId of roleIds) {
        await this.models.UserRole.upsert({
          userId,
          roleId,
          assignedBy: ctx.actorUserId,
          assignedAt: new Date(),
          expiresAt: expiresAt ?? null,
        }, { transaction });
      }
      await this.audit(transaction, ctx, {
        targetUserId: userId,
        action: AuthAuditAction.ASSIGN_ROLE,
        resourceType: "auth_user",
        resourceId: userId,
        after: { roleIds, expiresAt, reason },
      });
    });
    this.permissionResolver?.invalidate(userId);
    return { userId, roleIds };
  }

  async removeUserRole({ userId, roleId, ctx }) {
    await this.transaction(async (transaction) => {
      const role = await this.models.Role.findByPk(roleId, { transaction });
      if (!role) throw new AppError("Role not found", { status: 404, code: "ROLE_NOT_FOUND" });
      if (String(userId) === String(ctx.actorUserId) && role.code === "SUPER_ADMIN") {
        throw new AppError("Cannot remove your own SUPER_ADMIN role", { status: 409, code: "LAST_SUPER_ADMIN_PROTECTED" });
      }
      await this.models.UserRole.destroy({ where: { userId, roleId }, transaction });
      await this.audit(transaction, ctx, {
        targetUserId: userId,
        action: "auth.role.remove",
        resourceType: "auth_user",
        resourceId: userId,
        after: { roleId },
      });
    });
    this.permissionResolver?.invalidate(userId);
    return { userId, roleId };
  }

  async assignUserPermissionGroups({ userId, groupIds, expiresAt, reason, ctx }) {
    await this.transaction(async (transaction) => {
      for (const permissionGroupId of groupIds) {
        await this.models.UserPermissionGroup.upsert({
          userId,
          permissionGroupId,
          assignedBy: ctx.actorUserId,
          assignedAt: new Date(),
          expiresAt: expiresAt ?? null,
          reason: reason ?? null,
        }, { transaction });
      }
      await this.audit(transaction, ctx, {
        targetUserId: userId,
        action: "auth.permission_group.assign",
        resourceType: "auth_user",
        resourceId: userId,
        after: { groupIds, expiresAt, reason },
      });
    });
    this.permissionResolver?.invalidate(userId);
    return { userId, groupIds };
  }

  async removeUserPermissionGroup({ userId, groupId, ctx }) {
    await this.transaction(async (transaction) => {
      await this.models.UserPermissionGroup.destroy({ where: { userId, permissionGroupId: groupId }, transaction });
      await this.audit(transaction, ctx, {
        targetUserId: userId,
        action: "auth.permission_group.remove",
        resourceType: "auth_user",
        resourceId: userId,
        after: { groupId },
      });
    });
    this.permissionResolver?.invalidate(userId);
    return { userId, groupId };
  }

  async assignUserPermissions({ userId, permissionIds, expiresAt, reason, ctx }) {
    if (!reason) throw new AppError("Direct permission reason is required", { status: 422, code: "DIRECT_PERMISSION_REASON_REQUIRED" });
    await this.transaction(async (transaction) => {
      for (const permissionId of permissionIds) {
        await this.models.UserPermission.upsert({
          userId,
          permissionId,
          assignedBy: ctx.actorUserId,
          assignedAt: new Date(),
          expiresAt: expiresAt ?? null,
          reason,
        }, { transaction });
      }
      await this.audit(transaction, ctx, {
        targetUserId: userId,
        action: "auth.permission.assign_direct",
        resourceType: "auth_user",
        resourceId: userId,
        after: { permissionIds, expiresAt, reason },
      });
    });
    this.permissionResolver?.invalidate(userId);
    return { userId, permissionIds };
  }

  async removeUserPermission({ userId, permissionId, ctx }) {
    await this.transaction(async (transaction) => {
      await this.models.UserPermission.destroy({ where: { userId, permissionId }, transaction });
      await this.audit(transaction, ctx, {
        targetUserId: userId,
        action: "auth.permission.remove_direct",
        resourceType: "auth_user",
        resourceId: userId,
        after: { permissionId },
      });
    });
    this.permissionResolver?.invalidate(userId);
    return { userId, permissionId };
  }

  async assignRolePermissionGroups({ roleId, groupIds, ctx }) {
    await this.transaction(async (transaction) => {
      for (const permissionGroupId of groupIds) {
        await this.models.RolePermissionGroup.findOrCreate({
          where: { roleId, permissionGroupId },
          defaults: { roleId, permissionGroupId },
          transaction,
        });
      }
      await this.audit(transaction, ctx, { action: "auth.role.update", resourceType: "role", resourceId: roleId, after: { groupIds } });
    });
    this.permissionResolver?.cache?.clear();
    return { roleId, groupIds };
  }

  async assignRolePermissions({ roleId, permissionIds, ctx }) {
    await this.transaction(async (transaction) => {
      for (const permissionId of permissionIds) {
        await this.models.RolePermission.findOrCreate({
          where: { roleId, permissionId },
          defaults: { roleId, permissionId },
          transaction,
        });
      }
      await this.audit(transaction, ctx, { action: "auth.role.update", resourceType: "role", resourceId: roleId, after: { permissionIds } });
    });
    this.permissionResolver?.cache?.clear();
    return { roleId, permissionIds };
  }

  async assignGroupPermissions({ permissionGroupId, permissionIds, ctx }) {
    await this.transaction(async (transaction) => {
      for (const permissionId of permissionIds) {
        await this.models.PermissionGroupPermission.findOrCreate({
          where: { permissionGroupId, permissionId },
          defaults: { permissionGroupId, permissionId },
          transaction,
        });
      }
      await this.audit(transaction, ctx, {
        action: "auth.permission_group.update",
        resourceType: "permission_group",
        resourceId: permissionGroupId,
        after: { permissionIds },
      });
    });
    this.permissionResolver?.cache?.clear();
    return { permissionGroupId, permissionIds };
  }
}

module.exports = { AuthorizationAdminService };
