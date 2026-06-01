"use strict";

const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const { env } = require("../../../configs/env");
const { generateOpaqueToken, generateTokenFamily, hashToken } = require("../../../shared/security/hash-token");

const parseExpiresInSeconds = (value) => {
  if (/^\d+$/.test(value)) return Number(value);
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return 15 * 60;
  const amount = Number(match[1]);
  const unit = match[2];
  return amount * ({ s: 1, m: 60, h: 3600, d: 86400 }[unit]);
};

class TokenService {
  constructor({
    accessSecret = env.JWT_ACCESS_SECRET,
    refreshTtlDays = env.REFRESH_TOKEN_TTL_DAYS,
    issuer = env.JWT_ISSUER,
    audience = env.JWT_AUDIENCE,
    accessExpiresIn = env.JWT_ACCESS_EXPIRES_IN,
  } = {}) {
    this.accessSecret = accessSecret;
    this.refreshTtlDays = refreshTtlDays;
    this.issuer = issuer;
    this.audience = audience;
    this.accessExpiresIn = accessExpiresIn;
  }

  signAccessToken({ user, sessionId, roles = [] }) {
    const expiresIn = parseExpiresInSeconds(this.accessExpiresIn);
    const accessToken = jwt.sign(
      {
        sub: user.id,
        authUserId: user.id,
        sessionId,
        tokenVersion: user.tokenVersion,
        roles,
        jti: crypto.randomUUID(),
      },
      this.accessSecret,
      {
        expiresIn,
        issuer: this.issuer,
        audience: this.audience,
      }
    );

    return { accessToken, expiresIn };
  }

  verifyAccessToken(token) {
    return jwt.verify(token, this.accessSecret, {
      issuer: this.issuer,
      audience: this.audience,
    });
  }

  issueRefreshToken(tokenFamily = generateTokenFamily()) {
    const refreshToken = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000);
    return {
      refreshToken,
      refreshTokenHash: hashToken(refreshToken),
      tokenFamily,
      expiresAt,
    };
  }

  hashRefreshToken(refreshToken) {
    return hashToken(refreshToken);
  }
}

module.exports = { TokenService };
