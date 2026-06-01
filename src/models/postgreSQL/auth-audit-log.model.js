"use strict";

module.exports = (sequelize, Sequelize) =>
  sequelize.define(
    "auth_audit_log",
    {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      actorUserId: { type: Sequelize.UUID, allowNull: true, field: "actor_user_id" },
      targetUserId: { type: Sequelize.UUID, allowNull: true, field: "target_user_id" },
      action: { type: Sequelize.STRING(120), allowNull: false },
      resourceType: { type: Sequelize.STRING(80), allowNull: false, field: "resource_type" },
      resourceId: { type: Sequelize.STRING(120), allowNull: true, field: "resource_id" },
      beforeJson: { type: Sequelize.JSONB, allowNull: true, field: "before_json" },
      afterJson: { type: Sequelize.JSONB, allowNull: true, field: "after_json" },
      ipAddress: { type: Sequelize.STRING(64), allowNull: true, field: "ip_address" },
      userAgent: { type: Sequelize.STRING(500), allowNull: true, field: "user_agent" },
      requestId: { type: Sequelize.STRING(120), allowNull: true, field: "request_id" },
    },
    {
      tableName: "auth_audit_logs",
      underscored: true,
      updatedAt: false,
      indexes: [{ fields: ["actor_user_id"] }, { fields: ["target_user_id"] }, { fields: ["action"] }],
    }
  );
