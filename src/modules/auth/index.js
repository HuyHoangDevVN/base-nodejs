"use strict";

const db = require("../../models/postgreSQL");
const { AuthService } = require("./auth.service");
const { AuthUserRepository } = require("./repositories/auth-user.repository");
const { AuthSessionRepository } = require("./repositories/auth-session.repository");
const { AuthRefreshTokenRepository } = require("./repositories/auth-refresh-token.repository");
const { PasswordService } = require("./services/password.service");
const { TokenService } = require("./services/token.service");
const { PermissionResolverService } = require("./services/permission-resolver.service");
const { AuditLogService } = require("../../shared/audit/audit-log.service");

const authUserRepository = new AuthUserRepository();
const authSessionRepository = new AuthSessionRepository();
const authRefreshTokenRepository = new AuthRefreshTokenRepository();
const passwordService = new PasswordService();
const tokenService = new TokenService();
const permissionResolver = new PermissionResolverService({ authUserRepository });
const auditLogService = new AuditLogService({
  repository: {
    create: (payload) => db.AuthAuditLog.create(payload).catch(() => null),
  },
});

const authService = new AuthService({
  userRepository: authUserRepository,
  sessionRepository: authSessionRepository,
  refreshTokenRepository: authRefreshTokenRepository,
  passwordService,
  tokenService,
  permissionResolver,
  auditLogService,
});

module.exports = {
  authService,
  authUserRepository,
  authSessionRepository,
  authRefreshTokenRepository,
  passwordService,
  tokenService,
  permissionResolver,
  auditLogService,
};
