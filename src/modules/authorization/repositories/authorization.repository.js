"use strict";

const db = require("../../../models/postgreSQL");

class AuthorizationRepository {
  constructor({ Role = db.Role, Permission = db.Permission, PermissionGroup = db.PermissionGroup, UserRole = db.UserRole } = {}) {
    this.Role = Role;
    this.Permission = Permission;
    this.PermissionGroup = PermissionGroup;
    this.UserRole = UserRole;
  }

  listRoles() {
    return this.Role.findAll({ order: [["code", "ASC"]] });
  }

  listPermissions() {
    return this.Permission.findAll({ order: [["code", "ASC"]] });
  }

  listPermissionGroups() {
    return this.PermissionGroup.findAll({ order: [["code", "ASC"]] });
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
}

module.exports = { AuthorizationRepository };
