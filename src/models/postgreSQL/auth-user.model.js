"use strict";

module.exports = (sequelize, Sequelize) =>
  sequelize.define(
    "auth_user",
    {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      email: { type: Sequelize.STRING(254), allowNull: true, unique: true },
      username: { type: Sequelize.STRING(100), allowNull: true, unique: true },
      employeeCode: { type: Sequelize.STRING(100), allowNull: true, unique: true, field: "employee_code" },
      passwordHash: { type: Sequelize.STRING(255), allowNull: false, field: "password_hash" },
      displayName: { type: Sequelize.STRING(150), allowNull: false, field: "display_name" },
      avatarUrl: { type: Sequelize.STRING(500), allowNull: true, field: "avatar_url" },
      departmentName: { type: Sequelize.STRING(150), allowNull: true, field: "department_name" },
      orgUnit: { type: Sequelize.STRING(150), allowNull: true, field: "org_unit" },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: "ACTIVE" },
      mustChangePassword: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false, field: "must_change_password" },
      tokenVersion: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1, field: "token_version" },
      lastLoginAt: { type: Sequelize.DATE, allowNull: true, field: "last_login_at" },
      deletedAt: { type: Sequelize.DATE, allowNull: true, field: "deleted_at" },
    },
    {
      tableName: "auth_users",
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ["email"] },
        { fields: ["username"] },
        { fields: ["employee_code"] },
        { fields: ["status"] },
      ],
    }
  );
