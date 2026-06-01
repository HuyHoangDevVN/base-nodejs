"use strict";

const db = require("../../../models/postgreSQL");
const { SessionStatus } = require("../../../constants/auth");

class AuthSessionRepository {
  constructor({ AuthSession = db.AuthSession } = {}) {
    this.AuthSession = AuthSession;
  }

  create(payload, options = {}) {
    return this.AuthSession.create(payload, options);
  }

  findActiveById(id) {
    return this.AuthSession.findOne({ where: { id, status: SessionStatus.ACTIVE } });
  }

  findByRefreshTokenHash(refreshTokenHash) {
    return this.AuthSession.findOne({ where: { refreshTokenHash } });
  }

  updateRefreshToken(session, payload) {
    return session.update(payload);
  }

  revoke(session, reason) {
    return session.update({
      status: SessionStatus.REVOKED,
      revokedAt: new Date(),
      revokeReason: reason,
    });
  }

  revokeByFamily(tokenFamily, reason) {
    return this.AuthSession.update(
      {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
        revokeReason: reason,
      },
      { where: { tokenFamily } }
    );
  }

  revokeAllForUser(userId, reason, exceptSessionId = null) {
    const where = { userId, status: SessionStatus.ACTIVE };
    if (exceptSessionId) {
      const { Op } = require("sequelize");
      where.id = { [Op.ne]: exceptSessionId };
    }
    return this.AuthSession.update(
      {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
        revokeReason: reason,
      },
      { where }
    );
  }
}

module.exports = { AuthSessionRepository };
