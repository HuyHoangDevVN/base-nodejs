"use strict";

const { authService } = require("../modules/auth");
const { AppError } = require("../errors/AppError");

class AccessService {
  static signUp = async () => {
    throw new AppError("Use /auth/register for account registration", { status: 410, code: "AUTH_SIGNUP_DEPRECATED" });
  };

  static register = async ({ payload, context }) => authService.register({ payload, context });

  static login = async ({ identifier, email, password, context }) =>
    authService.login({ identifier: identifier ?? email, password, context });

  static refresh = async ({ refreshToken, context }) => authService.refresh({ refreshToken, context });

  static logout = async ({ refreshToken, sessionId, actor, context }) =>
    authService.logout({ refreshToken, sessionId, actor, context });

  static logoutAll = async ({ actor, context }) => authService.logoutAll({ actor, context });

  static me = async ({ actor }) => authService.me({ actor });

  static changePassword = async ({ actor, oldPassword, newPassword, context }) =>
    authService.changePassword({ actor, oldPassword, newPassword, context });
}

module.exports = AccessService;
