"use strict";

module.exports = (sequelize, Sequelize) =>
  sequelize.define(
    "permission_group",
    {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      code: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      module: { type: Sequelize.STRING(80), allowNull: false },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true, field: "is_active" },
    },
    { tableName: "permission_groups", underscored: true, indexes: [{ fields: ["code"] }, { fields: ["module"] }] }
  );
