"use strict";

const { AuthService } = require("../src/modules/auth/auth.service");
const { PasswordService } = require("../src/modules/auth/services/password.service");
const { TokenService } = require("../src/modules/auth/services/token.service");
const { PermissionResolverService } = require("../src/modules/auth/services/permission-resolver.service");
const { AccountStatus, SessionStatus } = require("../src/constants/auth");
const { env } = require("../src/configs/env");

const auditLogService = { record: jest.fn().mockResolvedValue(null) };

const buildAuthService = (overrides = {}) => {
  const passwordService = overrides.passwordService ?? new PasswordService({ rounds: 4 });
  const tokenService = overrides.tokenService ?? new TokenService({ accessSecret: "test-access-secret", accessExpiresIn: "15m" });
  return new AuthService({
    userRepository: overrides.userRepository,
    sessionRepository: overrides.sessionRepository,
    permissionResolver: overrides.permissionResolver,
    passwordService,
    tokenService,
    auditLogService,
  });
};

describe("base auth service", () => {
  beforeEach(() => {
    auditLogService.record.mockClear();
  });

  test("login returns env-admin fallback without DB for backward-compatible dev/test", async () => {
    const service = buildAuthService({
      userRepository: { findByIdentifier: jest.fn() },
      sessionRepository: { create: jest.fn() },
      permissionResolver: { resolveEffectivePermissions: jest.fn() },
    });

    const result = await service.login({ identifier: "admin@example.com", password: "password" });

    expect(result.user).toMatchObject({ email: "admin@example.com", role: "admin" });
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
  });

  test("env-admin fallback is blocked in production unless explicitly enabled", async () => {
    const previousNodeEnv = env.NODE_ENV;
    const previousEnabled = env.AUTH_ENV_ADMIN_ENABLED_BOOL;
    env.NODE_ENV = "production";
    env.AUTH_ENV_ADMIN_ENABLED_BOOL = false;
    const service = buildAuthService({
      userRepository: { findByIdentifier: jest.fn().mockResolvedValue(null) },
      sessionRepository: { create: jest.fn() },
      permissionResolver: { resolveEffectivePermissions: jest.fn() },
    });

    await expect(service.login({ identifier: "admin@example.com", password: "password" })).rejects.toMatchObject({
      status: 401,
      code: "INVALID_CREDENTIALS",
    });

    env.NODE_ENV = previousNodeEnv;
    env.AUTH_ENV_ADMIN_ENABLED_BOOL = previousEnabled;
  });

  test("env-admin fallback works in production only when explicitly enabled", async () => {
    const previousNodeEnv = env.NODE_ENV;
    const previousEnabled = env.AUTH_ENV_ADMIN_ENABLED_BOOL;
    env.NODE_ENV = "production";
    env.AUTH_ENV_ADMIN_ENABLED_BOOL = true;
    const service = buildAuthService({
      userRepository: { findByIdentifier: jest.fn() },
      sessionRepository: { create: jest.fn() },
      permissionResolver: { resolveEffectivePermissions: jest.fn() },
    });

    const result = await service.login({ identifier: "admin@example.com", password: "password" });
    expect(result.user.role).toBe("admin");

    env.NODE_ENV = previousNodeEnv;
    env.AUTH_ENV_ADMIN_ENABLED_BOOL = previousEnabled;
  });

  test("refresh rotates refresh token and keeps token family", async () => {
    const passwordService = new PasswordService({ rounds: 4 });
    const tokenService = new TokenService({ accessSecret: "test-access-secret", accessExpiresIn: "15m" });
    const issued = tokenService.issueRefreshToken("11111111-1111-4111-8111-111111111111");
    const session = {
      id: "session-1",
      userId: "user-1",
      status: SessionStatus.ACTIVE,
      tokenFamily: issued.tokenFamily,
      expiresAt: new Date(Date.now() + 60_000),
      update: jest.fn(async (payload) => Object.assign(session, payload)),
    };
    const user = { id: "user-1", status: AccountStatus.ACTIVE, tokenVersion: 1 };
    const service = buildAuthService({
      passwordService,
      tokenService,
      userRepository: { findById: jest.fn().mockResolvedValue(user) },
      sessionRepository: {
        findByRefreshTokenHash: jest.fn().mockResolvedValue(session),
        updateRefreshToken: jest.fn((target, payload) => target.update(payload)),
      },
      permissionResolver: { resolveEffectivePermissions: jest.fn().mockResolvedValue({ roles: [], permissions: [] }) },
    });

    const result = await service.refresh({ refreshToken: issued.refreshToken });

    expect(result.refreshToken).not.toBe(issued.refreshToken);
    expect(session.update).toHaveBeenCalledWith(expect.objectContaining({
      refreshTokenHash: expect.any(String),
    }));
    expect(session.tokenFamily).toBe(issued.tokenFamily);
  });

  test("refresh token reuse revokes token family", async () => {
    const session = {
      id: "session-1",
      userId: "user-1",
      status: SessionStatus.REVOKED,
      tokenFamily: "11111111-1111-4111-8111-111111111111",
      expiresAt: new Date(Date.now() + 60_000),
    };
    const sessionRepository = {
      findByRefreshTokenHash: jest.fn().mockResolvedValue(session),
      revokeByFamily: jest.fn().mockResolvedValue([1]),
    };
    const service = buildAuthService({
      userRepository: {},
      sessionRepository,
      permissionResolver: {},
    });

    await expect(service.refresh({ refreshToken: "old-token" })).rejects.toMatchObject({
      status: 401,
      code: "INVALID_REFRESH_TOKEN",
    });
    expect(sessionRepository.revokeByFamily).toHaveBeenCalledWith(session.tokenFamily, "refresh_reuse_detected");
  });
});

describe("permission resolver", () => {
  test("combines role, group and direct permissions while ignoring inactive/expired assignments", async () => {
    const resolver = new PermissionResolverService({
      authUserRepository: {
        findByIdWithAuthGraph: jest.fn().mockResolvedValue({
          get: () => ({
            roles: [
              {
                code: "ADMIN",
                name: "Admin",
                isActive: true,
                user_role: {},
                directPermissions: [{ code: "auth.user.read", isActive: true }],
                permissionGroups: [
                  {
                    code: "EMPLOYEE_MANAGEMENT",
                    name: "Employee Management",
                    isActive: true,
                    permissions: [
                      { code: "hrm.employee.read", isActive: true },
                      { code: "hrm.employee.delete", isActive: false },
                    ],
                  },
                ],
              },
              {
                code: "EXPIRED",
                name: "Expired",
                isActive: true,
                user_role: { expiresAt: new Date(Date.now() - 1000) },
                directPermissions: [{ code: "expired.permission", isActive: true }],
              },
            ],
            directPermissionGroups: [],
            directPermissions: [
              { code: "auth.permission.assign_direct", isActive: true, user_permission: { reason: "temporary" } },
            ],
          }),
        }),
      },
    });

    const result = await resolver.resolveEffectivePermissions("user-1");

    expect(result.permissions).toEqual([
      "auth.permission.assign_direct",
      "auth.user.read",
      "hrm.employee.read",
    ]);
    expect(result.permissionGroups).toEqual([{ code: "EMPLOYEE_MANAGEMENT", name: "Employee Management" }]);
  });
});
