"use strict";

const { SystemRole } = require("../../../constants/auth");

const toPlain = (entity) => (entity?.get ? entity.get({ plain: true }) : entity);
const assignmentActive = (through) => !through?.expiresAt || new Date(through.expiresAt).getTime() > Date.now();
const permissionActive = (permission) => permission?.isActive !== false;

class PermissionResolverService {
  constructor({ authUserRepository, cacheTtlMs = 30_000 } = {}) {
    this.authUserRepository = authUserRepository;
    this.cacheTtlMs = cacheTtlMs;
    this.cache = new Map();
  }

  invalidate(userId) {
    if (userId) this.cache.delete(userId);
  }

  async resolveEffectivePermissions(userId) {
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const userEntity = await this.authUserRepository.findByIdWithAuthGraph(userId);
    const user = toPlain(userEntity);
    if (!user) {
      return { roles: [], permissionGroups: [], permissions: [] };
    }

    const roles = (user.roles ?? []).filter((role) => role.isActive !== false && assignmentActive(role.user_role));
    const permissions = new Set();
    const permissionGroups = new Map();

    if (roles.some((role) => role.code === SystemRole.SUPER_ADMIN)) {
      permissions.add("*");
    }

    for (const role of roles) {
      for (const permission of role.directPermissions ?? []) {
        if (permissionActive(permission)) permissions.add(permission.code);
      }
      for (const group of role.permissionGroups ?? []) {
        if (group.isActive === false) continue;
        permissionGroups.set(group.code, { code: group.code, name: group.name });
        for (const permission of group.permissions ?? []) {
          if (permissionActive(permission)) permissions.add(permission.code);
        }
      }
    }

    for (const group of user.directPermissionGroups ?? []) {
      if (group.isActive === false || !assignmentActive(group.user_permission_group)) continue;
      permissionGroups.set(group.code, { code: group.code, name: group.name });
      for (const permission of group.permissions ?? []) {
        if (permissionActive(permission)) permissions.add(permission.code);
      }
    }

    for (const permission of user.directPermissions ?? []) {
      if (permissionActive(permission) && assignmentActive(permission.user_permission)) {
        permissions.add(permission.code);
      }
    }

    const value = {
      roles: roles.map((role) => ({ code: role.code, name: role.name })),
      permissionGroups: [...permissionGroups.values()],
      permissions: [...permissions].sort(),
    };
    this.cache.set(userId, { value, expiresAt: Date.now() + this.cacheTtlMs });
    return value;
  }

  async hasPermission(userId, permissionCode) {
    const result = await this.resolveEffectivePermissions(userId);
    return result.permissions.includes("*") || result.permissions.includes(permissionCode);
  }
}

module.exports = { PermissionResolverService };
