"use strict";

const { z } = require("zod");

const emailPasswordBase = z.object({
  email: z.string().email().max(254).optional(),
  identifier: z.string().trim().min(1).max(254).optional(),
  password: z.string().min(6).max(128),
});

const emailPasswordBody = emailPasswordBase.refine((body) => body.email || body.identifier, {
  message: "identifier or email is required",
});

const refreshBody = z.object({
  refreshToken: z.string().min(20),
});

const registerBody = z.object({
  email: z.string().email().max(254).optional(),
  username: z.string().trim().min(1).max(100).optional(),
  employeeCode: z.string().trim().min(1).max(100).optional(),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(150),
}).refine((body) => body.email || body.username || body.employeeCode, {
  message: "email, username or employeeCode is required",
});

const changePasswordBody = z.object({
  oldPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

const sessionParams = z.object({
  sessionId: z.string().uuid(),
});

module.exports = {
  loginSchema: { body: emailPasswordBody },
  registerSchema: { body: registerBody },
  signupSchema: { body: emailPasswordBase.extend({ name: z.string().trim().min(1).max(150).optional() }) },
  refreshSchema: { body: refreshBody },
  logoutSchema: { body: refreshBody.extend({ sessionId: z.string().uuid().optional() }).partial().optional() },
  changePasswordSchema: { body: changePasswordBody },
  sessionParamsSchema: { params: sessionParams },
};
