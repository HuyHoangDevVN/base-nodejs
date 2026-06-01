"use strict";

module.exports = (sequelize, Sequelize) =>
  sequelize.define(
    "permission",
    {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      code: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      module: { type: Sequelize.STRING(80), allowNull: false },
      resource: { type: Sequelize.STRING(100), allowNull: false },
      action: { type: Sequelize.STRING(80), allowNull: false },
      apiMethod: { type: Sequelize.STRING(16), allowNull: true, field: "api_method" },
      apiPathPattern: { type: Sequelize.STRING(255), allowNull: true, field: "api_path_pattern" },
      isSystem: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false, field: "is_system" },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true, field: "is_active" },
    },
    { tableName: "permissions", underscored: true, indexes: [{ fields: ["code"] }, { fields: ["module"] }, { fields: ["is_active"] }] }
  );
