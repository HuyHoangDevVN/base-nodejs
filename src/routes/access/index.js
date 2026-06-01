"use strict";

const express = require("express");
const accessController = require("../../controllers/access.controller");
const { asyncHandler } = require("../../middlewares/asyncHandler");
const { authenticate } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  signupSchema,
  refreshSchema,
  sessionParamsSchema,
  logoutSchema,
} = require("../../validators/auth.validator");

const router = express.Router();

router.post("/auth/signup", validate(signupSchema), asyncHandler(accessController.signUp));
router.post("/auth/register", validate(registerSchema), asyncHandler(accessController.register));
router.post("/auth/login", validate(loginSchema), asyncHandler(accessController.login));
router.post("/auth/refresh", validate(refreshSchema), asyncHandler(accessController.refresh));
router.post("/auth/logout", authenticate, validate(logoutSchema), asyncHandler(accessController.logout));
router.post("/auth/logout-all", authenticate, asyncHandler(accessController.logoutAll));
router.get("/auth/sessions", authenticate, asyncHandler(accessController.listSessions));
router.delete("/auth/sessions/:sessionId", authenticate, validate(sessionParamsSchema), asyncHandler(accessController.revokeSession));
router.get("/auth/me", authenticate, asyncHandler(accessController.me));
router.post("/auth/change-password", authenticate, validate(changePasswordSchema), asyncHandler(accessController.changePassword));

// Backward-compatible alias. Kept intentionally, but it no longer returns a fake user id.
router.post("/ecommerce/signup", validate(signupSchema), asyncHandler(accessController.signUp));

module.exports = router;
