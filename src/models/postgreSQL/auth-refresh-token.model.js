"use strict";

module.exports = (sequelize, Sequelize) =>
  sequelize.define(
    "auth_refresh_token",
    {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      sessionId: { type: Sequelize.UUID, allowNull: false, field: "session_id" },
      tokenFamily: { type: Sequelize.UUID, allowNull: false, field: "token_family" },
      refreshTokenHash: { type: Sequelize.STRING(128), allowNull: false, unique: true, field: "refresh_token_hash" },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: "ACTIVE" },
      expiresAt: { type: Sequelize.DATE, allowNull: false, field: "expires_at" },
      rotatedAt: { type: Sequelize.DATE, allowNull: true, field: "rotated_at" },
      reusedAt: { type: Sequelize.DATE, allowNull: true, field: "reused_at" },
      revokedAt: { type: Sequelize.DATE, allowNull: true, field: "revoked_at" },
    },
    {
      tableName: "auth_refresh_tokens",
      underscored: true,
      indexes: [
        { fields: ["refresh_token_hash"] },
        { fields: ["session_id"] },
        { fields: ["token_family"] },
        { fields: ["status"] },
      ],
    }
  );
