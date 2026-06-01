"use strict";

module.exports = (sequelize, Sequelize) =>
  sequelize.define(
    "role",
    {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      code: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      isSystem: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false, field: "is_system" },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true, field: "is_active" },
    },
    { tableName: "roles", underscored: true, indexes: [{ fields: ["code"] }, { fields: ["is_active"] }] }
  );
