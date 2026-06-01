"use strict";

const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const { env } = require("../configs/env");
const { Roles } = require("../constants/roles");
const { AppError } = require("../errors/AppError");

const refreshTokens = new Map();

const safeEqual = (left, right) => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const publicUser = {
  id: "env-admin",
  email: env.AUTH_ADMIN_EMAIL,
  role: Roles.ADMIN,
};

const signAccessToken = (user) =>
  jwt.sign(user, env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });

const signRefreshToken = (user) => {
  const tokenId = crypto.randomUUID();
  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role, tokenId }, env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
  refreshTokens.set(tokenId, user);
  return token;
};

class AccessService {
  static signUp = async () => {
    throw new AppError("Signup persistence is not configured", {
      status: 501,
      code: "AUTH_SIGNUP_NOT_CONFIGURED",
    });
  };

  static login = async ({ email, password }) => {
    if (!safeEqual(email, env.AUTH_ADMIN_EMAIL) || !safeEqual(password, env.AUTH_ADMIN_PASSWORD)) {
      throw new AppError("Invalid email or password", {
        status: 401,
        code: "INVALID_CREDENTIALS",
      });
    }

    return {
      user: publicUser,
      accessToken: signAccessToken(publicUser),
      refreshToken: signRefreshToken(publicUser),
    };
  };

  static refresh = async ({ refreshToken }) => {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
      const user = refreshTokens.get(payload.tokenId);
      if (!user) {
        throw new Error("Refresh token revoked");
      }
      refreshTokens.delete(payload.tokenId);
      return {
        user,
        accessToken: signAccessToken(user),
        refreshToken: signRefreshToken(user),
      };
    } catch (error) {
      throw new AppError("Invalid or expired refresh token", {
        status: 401,
        code: "INVALID_REFRESH_TOKEN",
      });
    }
  };

  static logout = async ({ refreshToken }) => {
    if (!refreshToken) {
      return { revoked: false };
    }
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
      return { revoked: refreshTokens.delete(payload.tokenId) };
    } catch (error) {
      return { revoked: false };
    }
  };
}

module.exports = AccessService;
