"use strict";

const db = require("../../../models/postgreSQL");

const RefreshTokenStatus = Object.freeze({
  ACTIVE: "ACTIVE",
  ROTATED: "ROTATED",
  REVOKED: "REVOKED",
  REUSED: "REUSED",
});

class AuthRefreshTokenRepository {
  constructor({ AuthRefreshToken = db.AuthRefreshToken } = {}) {
    this.AuthRefreshToken = AuthRefreshToken;
  }

  create(payload, options = {}) {
    return this.AuthRefreshToken.create(payload, options);
  }

  findByHash(refreshTokenHash) {
    return this.AuthRefreshToken.findOne({ where: { refreshTokenHash } });
  }

  markRotated(tokenRecord) {
    if (!tokenRecord) return null;
    return tokenRecord.update({ status: RefreshTokenStatus.ROTATED, rotatedAt: new Date() });
  }

  markReused(tokenRecord) {
    if (!tokenRecord) return null;
    return tokenRecord.update({ status: RefreshTokenStatus.REUSED, reusedAt: new Date() });
  }

  revokeByFamily(tokenFamily) {
    return this.AuthRefreshToken.update(
      { status: RefreshTokenStatus.REVOKED, revokedAt: new Date() },
      { where: { tokenFamily, status: RefreshTokenStatus.ACTIVE } }
    );
  }
}

module.exports = { AuthRefreshTokenRepository, RefreshTokenStatus };
