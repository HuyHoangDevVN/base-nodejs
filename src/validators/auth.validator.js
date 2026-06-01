"use strict";

const { z } = require("zod");

const emailPasswordBody = z.object({
  email: z.string().email().max(254),
  password: z.string().min(6).max(128),
});

const refreshBody = z.object({
  refreshToken: z.string().min(20),
});

module.exports = {
  loginSchema: { body: emailPasswordBody },
  signupSchema: { body: emailPasswordBody.extend({ name: z.string().trim().min(1).max(150).optional() }) },
  refreshSchema: { body: refreshBody },
  logoutSchema: { body: refreshBody.partial().optional() },
};
