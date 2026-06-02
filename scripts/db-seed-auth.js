"use strict";

const bcrypt = require("bcrypt");
const db = require("../src/models/postgreSQL");
const { env } = require("../src/configs/env");
const { logger } = require("../src/shared/logger/logger");
const {
  DEFAULT_PERMISSIONS,
  DEFAULT_PERMISSION_GROUPS,
  DEFAULT_ROLES,
  ROLE_PERMISSION_GROUPS,
} = require("../src/dbs/seeds/base-auth.seed");

const serializeError = (error) => ({
  name: error?.name,
  message: error?.message,
  stack: error?.stack,
  parentMessage: error?.parent?.message,
  originalMessage: error?.original?.message,
});

const upsertPermission = async ([code, name, moduleName, resource, action, apiMethod, apiPathPattern], transaction) => {
  const [permission] = await db.Permission.findOrCreate({
    where: { code },
    defaults: { code, name, module: moduleName, resource, action, apiMethod, apiPathPattern, isSystem: true, isActive: true },
    transaction,
  });
  await permission.update({ name, module: moduleName, resource, action, apiMethod, apiPathPattern, isSystem: true, isActive: true }, { transaction });
  return permission;
};

const upsertRole = async ([code, name, description], transaction) => {
  const [role] = await db.Role.findOrCreate({
    where: { code },
    defaults: { code, name, description, isSystem: true, isActive: true },
    transaction,
  });
  await role.update({ name, description, isSystem: true, isActive: true }, { transaction });
  return role;
};

const upsertGroup = async ([code, name, moduleName, permissionCodes], permissionsByCode, transaction) => {
  const [group] = await db.PermissionGroup.findOrCreate({
    where: { code },
    defaults: { code, name, module: moduleName, isActive: true },
    transaction,
  });
  await group.update({ name, module: moduleName, isActive: true }, { transaction });
  for (const permissionCode of permissionCodes) {
    const permission = permissionsByCode.get(permissionCode);
    if (permission) {
      await db.PermissionGroupPermission.findOrCreate({
        where: { permissionGroupId: group.id, permissionId: permission.id },
        defaults: { permissionGroupId: group.id, permissionId: permission.id },
        transaction,
      });
    }
  }
  return group;
};

const bootstrapAdmin = async (superAdminRole, transaction) => {
  const bootstrapDisabledByCommand = process.argv.includes("--no-bootstrap");
  if (!env.BOOTSTRAP_ADMIN_ENABLED_BOOL || bootstrapDisabledByCommand) {
    logger.info("bootstrap_admin_skipped");
    return null;
  }
  if (env.NODE_ENV === "production" && (!env.BOOTSTRAP_ADMIN_EMAIL || !env.BOOTSTRAP_ADMIN_PASSWORD)) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required when bootstrap admin is enabled in production");
  }

  const email = env.BOOTSTRAP_ADMIN_EMAIL ?? env.AUTH_ADMIN_EMAIL;
  const password = env.BOOTSTRAP_ADMIN_PASSWORD ?? env.AUTH_ADMIN_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.AuthUser.findOrCreate({
    where: { email },
    defaults: {
      email,
      passwordHash,
      displayName: "Bootstrap Admin",
      status: "ACTIVE",
      mustChangePassword: env.NODE_ENV === "production",
    },
    transaction,
  });
  await db.UserRole.findOrCreate({
    where: { userId: user.id, roleId: superAdminRole.id },
    defaults: { userId: user.id, roleId: superAdminRole.id, assignedAt: new Date() },
    transaction,
  });
  logger.warn({ userId: user.id, email }, "bootstrap_admin_enabled");
  return user;
};

const run = async () => {
  const transaction = await db.sequelize.transaction();
  try {
    const permissions = new Map();
    for (const item of DEFAULT_PERMISSIONS) {
      const permission = await upsertPermission(item, transaction);
      permissions.set(permission.code, permission);
    }

    const groups = new Map();
    for (const item of DEFAULT_PERMISSION_GROUPS) {
      const group = await upsertGroup(item, permissions, transaction);
      groups.set(group.code, group);
    }

    const roles = new Map();
    for (const item of DEFAULT_ROLES) {
      const role = await upsertRole(item, transaction);
      roles.set(role.code, role);
    }

    for (const [roleCode, groupCodes] of Object.entries(ROLE_PERMISSION_GROUPS)) {
      const role = roles.get(roleCode);
      if (!role) continue;
      for (const groupCode of groupCodes) {
        const group = groups.get(groupCode);
        if (group) {
          await db.RolePermissionGroup.findOrCreate({
            where: { roleId: role.id, permissionGroupId: group.id },
            defaults: { roleId: role.id, permissionGroupId: group.id },
            transaction,
          });
        }
      }
    }

    await bootstrapAdmin(roles.get("SUPER_ADMIN"), transaction);
    await transaction.commit();
    logger.info({ permissions: permissions.size, groups: groups.size, roles: roles.size }, "base_auth_seed_complete");
  } catch (error) {
    await transaction.rollback();
    logger.error({ error: serializeError(error) }, "base_auth_seed_failed");
    throw error;
  }
};

run()
  .then(() => db.sequelize.close())
  .catch(async (error) => {
    logger.error({ error: serializeError(error) }, "db_seed_failed");
    await db.sequelize.close().catch(() => {});
    process.exit(1);
  });
