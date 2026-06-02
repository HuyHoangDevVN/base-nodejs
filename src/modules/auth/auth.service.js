"use strict";

const crypto = require("node:crypto");
const { env } = require("../../configs/env");
const { Roles } = require("../../constants/roles");
const { AccountStatus, AuthAuditAction, SessionStatus } = require("../../constants/auth");
const { AppError } = require("../../errors/AppError");
const { ConflictError } = require("../../shared/errors/conflict-error");
const { UnauthorizedError } = require("../../shared/errors/unauthorized-error");
const { toPublicAuthUser } = require("./mappers/auth-user.mapper");
const { logger } = require("../../shared/logger/logger");

const safeEqual = (left, right) => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

class AuthService {
  constructor({
    userRepository,
    sessionRepository,
    refreshTokenRepository,
    passwordService,
    tokenService,
    permissionResolver,
    auditLogService,
    clock = () => new Date(),
  }) {
    this.userRepository = userRepository;
    this.sessionRepository = sessionRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.passwordService = passwordService;
    this.tokenService = tokenService;
    this.permissionResolver = permissionResolver;
    this.auditLogService = auditLogService;
    this.clock = clock;
  }

  async register({ payload, context = {} }) {
    const duplicate = await this.userRepository.findDuplicateIdentity(payload);
    if (duplicate) {
      throw new ConflictError("Account already exists", "AUTH_ACCOUNT_EXISTS");
    }

    const passwordHash = await this.passwordService.hash(payload.password);
    const user = await this.userRepository.create({
      email: payload.email ?? null,
      username: payload.username ?? null,
      employeeCode: payload.employeeCode ?? null,
      passwordHash,
      displayName: payload.displayName,
      status: AccountStatus.ACTIVE,
    });

    await this.auditLogService.record({
      actorUserId: null,
      targetUserId: user.id,
      action: AuthAuditAction.REGISTER,
      resourceType: "auth_user",
      resourceId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
    });

    return toPublicAuthUser(user);
  }

  async login({ identifier, password, context = {} }) {
    const user = await this.findUserForLogin(identifier);
    if (!user) {
      await this.recordLoginFailure(null, context);
      throw new UnauthorizedError("Invalid credentials", "INVALID_CREDENTIALS");
    }

    if (![AccountStatus.ACTIVE, "active"].includes(user.status)) {
      await this.recordLoginFailure(user.id, context);
      throw new UnauthorizedError("Invalid credentials", "INVALID_CREDENTIALS");
    }

    const passwordValid = await this.passwordService.verify(password, user.passwordHash);
    if (!passwordValid) {
      await this.recordLoginFailure(user.id, context);
      throw new UnauthorizedError("Invalid credentials", "INVALID_CREDENTIALS");
    }

    if (user.legacyEnvAdmin) {
      const sessionId = "env-session";
      const refresh = this.tokenService.issueRefreshToken();
      const { accessToken, expiresIn } = this.tokenService.signAccessToken({
        user,
        sessionId,
        roles: ["SUPER_ADMIN", "ADMIN"],
      });
      return {
        accessToken,
        refreshToken: refresh.refreshToken,
        expiresIn,
        user: {
          id: user.id,
          email: user.email,
          role: Roles.ADMIN,
          roles: [{ code: "SUPER_ADMIN", name: "Super Admin" }],
          permissions: ["*"],
        },
        session: { id: sessionId, expiresAt: refresh.expiresAt },
      };
    }

    const authz = await this.permissionResolver.resolveEffectivePermissions(user.id);
    const refresh = this.tokenService.issueRefreshToken();
    const session = await this.sessionRepository.create({
      userId: user.id,
      refreshTokenHash: refresh.refreshTokenHash,
      tokenFamily: refresh.tokenFamily,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      deviceName: context.deviceName,
      status: SessionStatus.ACTIVE,
      expiresAt: refresh.expiresAt,
      lastUsedAt: this.clock(),
    });
    await this.refreshTokenRepository?.create({
      sessionId: session.id,
      tokenFamily: refresh.tokenFamily,
      refreshTokenHash: refresh.refreshTokenHash,
      status: "ACTIVE",
      expiresAt: refresh.expiresAt,
    });
    const { accessToken, expiresIn } = this.tokenService.signAccessToken({
      user,
      sessionId: session.id,
      roles: authz.roles.map((role) => role.code),
    });

    await this.userRepository.updateById(user.id, { lastLoginAt: this.clock() });
    await this.auditLogService.record({
      actorUserId: user.id,
      targetUserId: user.id,
      action: AuthAuditAction.LOGIN_SUCCESS,
      resourceType: "auth_session",
      resourceId: session.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
    });

    return {
      accessToken,
      refreshToken: refresh.refreshToken,
      expiresIn,
      user: {
        ...toPublicAuthUser(user),
        role: authz.roles[0]?.code?.toLowerCase?.() ?? Roles.USER,
        roles: authz.roles,
        permissions: authz.permissions,
      },
      session: { id: session.id, expiresAt: refresh.expiresAt },
    };
  }

  async refresh({ refreshToken, context = {} }) {
    const refreshTokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const tokenRecord = await this.refreshTokenRepository?.findByHash(refreshTokenHash);
    const session = await this.sessionRepository.findByRefreshTokenHash(refreshTokenHash);

    if (tokenRecord && tokenRecord.status !== "ACTIVE") {
      await this.refreshTokenRepository?.markReused(tokenRecord);
      await this.refreshTokenRepository?.revokeByFamily(tokenRecord.tokenFamily);
      await this.sessionRepository.revokeByFamily(tokenRecord.tokenFamily, "refresh_reuse_detected");
      await this.auditLogService.record({
        actorUserId: session?.userId ?? null,
        targetUserId: session?.userId ?? null,
        action: AuthAuditAction.REFRESH_REUSE_DETECTED,
        resourceType: "auth_refresh_token",
        resourceId: tokenRecord.id,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestId: context.requestId,
      });
      throw new UnauthorizedError("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
    }

    if (!session || session.status !== SessionStatus.ACTIVE || new Date(session.expiresAt).getTime() <= Date.now()) {
      if (session?.tokenFamily || tokenRecord?.tokenFamily) {
        const family = session?.tokenFamily ?? tokenRecord.tokenFamily;
        await this.refreshTokenRepository?.revokeByFamily(family);
        await this.sessionRepository.revokeByFamily(family, "refresh_reuse_detected");
        await this.auditLogService.record({
          actorUserId: session?.userId ?? null,
          targetUserId: session?.userId ?? null,
          action: AuthAuditAction.REFRESH_REUSE_DETECTED,
          resourceType: "auth_session",
          resourceId: session.id,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestId: context.requestId,
        });
      }
      throw new UnauthorizedError("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
    }

    const user = await this.userRepository.findById(session.userId);
    if (!user || user.status !== AccountStatus.ACTIVE) {
      await this.sessionRepository.revoke(session, "user_inactive");
      throw new UnauthorizedError("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
    }

    const authz = await this.permissionResolver.resolveEffectivePermissions(user.id);
    const rotated = this.tokenService.issueRefreshToken(session.tokenFamily);
    await this.refreshTokenRepository?.markRotated(tokenRecord);
    await this.sessionRepository.updateRefreshToken(session, {
      refreshTokenHash: rotated.refreshTokenHash,
      expiresAt: rotated.expiresAt,
      lastUsedAt: this.clock(),
    });
    await this.refreshTokenRepository?.create({
      sessionId: session.id,
      tokenFamily: rotated.tokenFamily,
      refreshTokenHash: rotated.refreshTokenHash,
      status: "ACTIVE",
      expiresAt: rotated.expiresAt,
    });
    const { accessToken, expiresIn } = this.tokenService.signAccessToken({
      user,
      sessionId: session.id,
      roles: authz.roles.map((role) => role.code),
    });

    await this.auditLogService.record({
      actorUserId: user.id,
      targetUserId: user.id,
      action: AuthAuditAction.REFRESH,
      resourceType: "auth_session",
      resourceId: session.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
    });

    return {
      accessToken,
      refreshToken: rotated.refreshToken,
      expiresIn,
      user: {
        ...toPublicAuthUser(user),
        role: authz.roles[0]?.code?.toLowerCase?.() ?? Roles.USER,
        roles: authz.roles,
        permissions: authz.permissions,
      },
      session: { id: session.id, expiresAt: rotated.expiresAt },
    };
  }

  async logout({ refreshToken, sessionId, actor, context = {} }) {
    let session = null;
    if (refreshToken) {
      session = await this.sessionRepository.findByRefreshTokenHash(this.tokenService.hashRefreshToken(refreshToken));
    } else if (sessionId) {
      session = await this.sessionRepository.findActiveById(sessionId);
    }
    if (session) {
      await this.sessionRepository.revoke(session, "logout");
    }
    await this.auditLogService.record({
      actorUserId: actor?.id ?? session?.userId ?? null,
      targetUserId: session?.userId ?? actor?.id ?? null,
      action: AuthAuditAction.LOGOUT,
      resourceType: "auth_session",
      resourceId: session?.id ?? sessionId ?? null,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
    });
    return { revoked: Boolean(session) };
  }

  async logoutAll({ actor, exceptSessionId = null, context = {} }) {
    const result = await this.sessionRepository.revokeAllForUser(actor.id, "logout_all", exceptSessionId);
    await this.auditLogService.record({
      actorUserId: actor.id,
      targetUserId: actor.id,
      action: AuthAuditAction.LOGOUT_ALL,
      resourceType: "auth_session",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
    });
    return { revokedCount: Array.isArray(result) ? result[0] : result };
  }

  async listSessions({ actor }) {
    const sessions = await this.sessionRepository.listForUser(actor.id);
    return { items: sessions };
  }

  async revokeOwnSession({ actor, sessionId, context = {} }) {
    const session = await this.sessionRepository.findActiveById(sessionId);
    if (!session || session.userId !== actor.id) {
      throw new AppError("Session not found", { status: 404, code: "SESSION_NOT_FOUND" });
    }
    await this.sessionRepository.revoke(session, "user_revoke");
    await this.auditLogService.record({
      actorUserId: actor.id,
      targetUserId: actor.id,
      action: AuthAuditAction.LOGOUT,
      resourceType: "auth_session",
      resourceId: session.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
    });
    return { id: session.id, revoked: true };
  }

  async me({ actor }) {
    const user = await this.userRepository.findById(actor.id);
    const authz = await this.permissionResolver.resolveEffectivePermissions(actor.id);
    return {
      user: toPublicAuthUser(user) ?? actor,
      roles: authz.roles,
      permissionGroups: authz.permissionGroups,
      permissions: authz.permissions,
      session: {
        id: actor.sessionId ?? null,
      },
    };
  }

  async changePassword({ actor, oldPassword, newPassword, context = {} }) {
    const user = await this.userRepository.findById(actor.id);
    if (!user || !(await this.passwordService.verify(oldPassword, user.passwordHash))) {
      throw new UnauthorizedError("Invalid current password", "INVALID_CREDENTIALS");
    }
    const passwordHash = await this.passwordService.hash(newPassword);
    await this.userRepository.updateById(user.id, {
      passwordHash,
      tokenVersion: user.tokenVersion + 1,
      mustChangePassword: false,
    });
    await this.sessionRepository.revokeAllForUser(user.id, "password_changed", actor.sessionId);
    await this.auditLogService.record({
      actorUserId: user.id,
      targetUserId: user.id,
      action: AuthAuditAction.CHANGE_PASSWORD,
      resourceType: "auth_user",
      resourceId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
    });
    return { changed: true };
  }

  async findUserForLogin(identifier) {
    const envAdminAllowed = env.NODE_ENV !== "production" || env.AUTH_ENV_ADMIN_ENABLED_BOOL;
    if (safeEqual(identifier, env.AUTH_ADMIN_EMAIL) && envAdminAllowed) {
      if (env.NODE_ENV === "production" && env.AUTH_ENV_ADMIN_ENABLED_BOOL) {
        logger.warn("AUTH_ENV_ADMIN_ENABLED is true in production");
      }
      return {
        id: "env-admin",
        email: env.AUTH_ADMIN_EMAIL,
        username: null,
        employeeCode: null,
        passwordHash: await this.passwordService.hashExisting(env.AUTH_ADMIN_PASSWORD),
        displayName: "Environment Admin",
        status: AccountStatus.ACTIVE,
        tokenVersion: 1,
        legacyEnvAdmin: true,
      };
    }

    return this.userRepository.findByIdentifier(identifier);
  }

  async recordLoginFailure(targetUserId, context) {
    await this.auditLogService.record({
      actorUserId: targetUserId,
      targetUserId,
      action: AuthAuditAction.LOGIN_FAILED,
      resourceType: "auth_user",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
    });
  }
}

module.exports = { AuthService };
