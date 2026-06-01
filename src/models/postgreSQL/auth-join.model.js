"use strict";

const defineJoinModels = (sequelize, Sequelize) => ({
  RolePermissionGroup: sequelize.define("role_permission_group", {}, { tableName: "role_permission_groups", underscored: true, timestamps: false }),
  RolePermission: sequelize.define("role_permission", {}, { tableName: "role_permissions", underscored: true, timestamps: false }),
  PermissionGroupPermission: sequelize.define("permission_group_permission", {}, { tableName: "permission_group_permissions", underscored: true, timestamps: false }),
  UserRole: sequelize.define(
    "user_role",
    {
      assignedBy: { type: Sequelize.UUID, allowNull: true, field: "assigned_by" },
      assignedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW, field: "assigned_at" },
      expiresAt: { type: Sequelize.DATE, allowNull: true, field: "expires_at" },
    },
    { tableName: "user_roles", underscored: true, timestamps: false }
  ),
  UserPermissionGroup: sequelize.define(
    "user_permission_group",
    {
      assignedBy: { type: Sequelize.UUID, allowNull: true, field: "assigned_by" },
      assignedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW, field: "assigned_at" },
      expiresAt: { type: Sequelize.DATE, allowNull: true, field: "expires_at" },
      reason: { type: Sequelize.TEXT, allowNull: true },
    },
    { tableName: "user_permission_groups", underscored: true, timestamps: false }
  ),
  UserPermission: sequelize.define(
    "user_permission",
    {
      assignedBy: { type: Sequelize.UUID, allowNull: true, field: "assigned_by" },
      assignedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW, field: "assigned_at" },
      expiresAt: { type: Sequelize.DATE, allowNull: true, field: "expires_at" },
      reason: { type: Sequelize.TEXT, allowNull: true },
    },
    { tableName: "user_permissions", underscored: true, timestamps: false }
  ),
});

module.exports = { defineJoinModels };
