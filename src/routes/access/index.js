"use strict";

const express = require("express");
const accessController = require("../../controllers/access.controller");
const { asyncHandler } = require("../../middlewares/asyncHandler");
const { authenticate } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const { loginSchema, signupSchema, refreshSchema, logoutSchema } = require("../../validators/auth.validator");

const router = express.Router();

router.post("/auth/signup", validate(signupSchema), asyncHandler(accessController.signUp));
router.post("/auth/login", validate(loginSchema), asyncHandler(accessController.login));
router.post("/auth/refresh", validate(refreshSchema), asyncHandler(accessController.refresh));
router.post("/auth/logout", validate(logoutSchema), asyncHandler(accessController.logout));
router.get("/auth/me", authenticate, asyncHandler(accessController.me));

// Backward-compatible alias. Kept intentionally, but it no longer returns a fake user id.
router.post("/ecommerce/signup", validate(signupSchema), asyncHandler(accessController.signUp));

module.exports = router;
