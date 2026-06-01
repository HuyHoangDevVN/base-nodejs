"use strict";

const db = require("../../../models/postgreSQL");

class AuthorizationRepository {
  constructor({
    Role = db.Role,
    Permission = db.Permission,
    PermissionGroup = db.PermissionGroup,
    UserRole = db.UserRole,
    UserPermission = db.UserPermission,
    UserPermissionGroup = db.UserPermissionGroup,
    RolePermission = db.RolePermission,
    RolePermissionGroup = db.RolePermissionGroup,
    PermissionGroupPermission = db.PermissionGroupPermission,
  } = {}) {
    this.Role = Role;
    this.Permission = Permission;
    this.PermissionGroup = PermissionGroup;
    this.UserRole = UserRole;
    this.UserPermission = UserPermission;
    this.UserPermissionGroup = UserPermissionGroup;
    this.RolePermission = RolePermission;
    this.RolePermissionGroup = RolePermissionGroup;
    this.PermissionGroupPermission = PermissionGroupPermission;
  }

  listRoles(where = {}) {
    return this.Role.findAll({ where, order: [["code", "ASC"]] });
  }

  findRoleById(id) {
    return this.Role.findByPk(id);
  }

  createRole(payload) {
    return this.Role.create(payload);
  }

  listPermissions(where = {}) {
    return this.Permission.findAll({ where, order: [["code", "ASC"]] });
  }

  findPermissionById(id) {
    return this.Permission.findByPk(id);
  }

  createPermission(payload) {
    return this.Permission.create(payload);
  }

  listPermissionGroups(where = {}) {
    return this.PermissionGroup.findAll({ where, order: [["code", "ASC"]] });
  }

  findPermissionGroupById(id) {
    return this.PermissionGroup.findByPk(id);
  }

  createPermissionGroup(payload) {
    return this.PermissionGroup.create(payload);
  }

  assignRoles({ userId, roleIds, assignedBy, expiresAt }) {
    return Promise.all(
      roleIds.map((roleId) =>
        this.UserRole.upsert({
          userId,
          roleId,
          assignedBy,
          assignedAt: new Date(),
          expiresAt: expiresAt ?? null,
        })
      )
    );
  }

  removeUserRole({ userId, roleId }) {
    return this.UserRole.destroy({ where: { userId, roleId } });
  }

  assignUserPermissionGroups({ userId, groupIds, assignedBy, expiresAt, reason }) {
    return Promise.all(groupIds.map((permissionGroupId) => this.UserPermissionGroup.upsert({
      userId,
      permissionGroupId,
      assignedBy,
      assignedAt: new Date(),
      expiresAt: expiresAt ?? null,
      reason: reason ?? null,
    })));
  }

  removeUserPermissionGroup({ userId, permissionGroupId }) {
    return this.UserPermissionGroup.destroy({ where: { userId, permissionGroupId } });
  }

  assignUserPermissions({ userId, permissionIds, assignedBy, expiresAt, reason }) {
    return Promise.all(permissionIds.map((permissionId) => this.UserPermission.upsert({
      userId,
      permissionId,
      assignedBy,
      assignedAt: new Date(),
      expiresAt: expiresAt ?? null,
      reason,
    })));
  }

  removeUserPermission({ userId, permissionId }) {
    return this.UserPermission.destroy({ where: { userId, permissionId } });
  }

  assignGroupPermissions({ permissionGroupId, permissionIds }) {
    return Promise.all(permissionIds.map((permissionId) => this.PermissionGroupPermission.findOrCreate({
      where: { permissionGroupId, permissionId },
      defaults: { permissionGroupId, permissionId },
    })));
  }

  removeGroupPermission({ permissionGroupId, permissionId }) {
    return this.PermissionGroupPermission.destroy({ where: { permissionGroupId, permissionId } });
  }

  assignRolePermissionGroups({ roleId, groupIds }) {
    return Promise.all(groupIds.map((permissionGroupId) => this.RolePermissionGroup.findOrCreate({
      where: { roleId, permissionGroupId },
      defaults: { roleId, permissionGroupId },
    })));
  }

  removeRolePermissionGroup({ roleId, permissionGroupId }) {
    return this.RolePermissionGroup.destroy({ where: { roleId, permissionGroupId } });
  }

  assignRolePermissions({ roleId, permissionIds }) {
    return Promise.all(permissionIds.map((permissionId) => this.RolePermission.findOrCreate({
      where: { roleId, permissionId },
      defaults: { roleId, permissionId },
    })));
  }

  removeRolePermission({ roleId, permissionId }) {
    return this.RolePermission.destroy({ where: { roleId, permissionId } });
  }
}

module.exports = { AuthorizationRepository };
