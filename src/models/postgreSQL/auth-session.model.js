"use strict";

module.exports = (sequelize, Sequelize) =>
  sequelize.define(
    "auth_session",
    {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      userId: { type: Sequelize.UUID, allowNull: false, field: "user_id" },
      refreshTokenHash: { type: Sequelize.STRING(128), allowNull: false, field: "refresh_token_hash" },
      tokenFamily: { type: Sequelize.UUID, allowNull: false, field: "token_family" },
      userAgent: { type: Sequelize.STRING(500), allowNull: true, field: "user_agent" },
      ipAddress: { type: Sequelize.STRING(64), allowNull: true, field: "ip_address" },
      deviceName: { type: Sequelize.STRING(150), allowNull: true, field: "device_name" },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: "ACTIVE" },
      expiresAt: { type: Sequelize.DATE, allowNull: false, field: "expires_at" },
      lastUsedAt: { type: Sequelize.DATE, allowNull: true, field: "last_used_at" },
      revokedAt: { type: Sequelize.DATE, allowNull: true, field: "revoked_at" },
      revokeReason: { type: Sequelize.STRING(255), allowNull: true, field: "revoke_reason" },
    },
    {
      tableName: "auth_sessions",
      underscored: true,
      indexes: [
        { fields: ["user_id"] },
        { fields: ["refresh_token_hash"] },
        { fields: ["token_family"] },
        { fields: ["status"] },
        { fields: ["expires_at"] },
      ],
    }
  );
