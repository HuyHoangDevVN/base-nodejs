"use strict";

const AccessService = require("../services/access.service");
const { sendSuccess } = require("../utils/apiResponse");

class AccessController {
  getContext = (req) => ({
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    deviceName: req.get("x-device-name"),
  });

  register = async (req, res) => {
    const data = await AccessService.register({ payload: req.validated.body, context: this.getContext(req) });
    return sendSuccess(res, {
      status: 201,
      code: "CREATED",
      message: "User registered successfully",
      data,
    });
  };

  signUp = async (req, res) => {
    const data = await AccessService.signUp(req.validated.body);
    return sendSuccess(res, {
      status: 201,
      code: "CREATED",
      message: "User signed up successfully",
      data,
    });
  };

  login = async (req, res) => {
    const data = await AccessService.login({ ...req.validated.body, context: this.getContext(req) });
    return sendSuccess(res, {
      code: "OK",
      message: "Login successful",
      data,
    });
  };

  refresh = async (req, res) => {
    const data = await AccessService.refresh({ ...req.validated.body, context: this.getContext(req) });
    return sendSuccess(res, {
      code: "OK",
      message: "Token refreshed",
      data,
    });
  };

  logout = async (req, res) => {
    const data = await AccessService.logout({
      ...(req.validated.body || {}),
      actor: req.auth,
      context: this.getContext(req),
    });
    return sendSuccess(res, {
      code: "OK",
      message: "Logout successful",
      data,
    });
  };

  logoutAll = async (req, res) => {
    const data = await AccessService.logoutAll({ actor: req.auth, context: this.getContext(req) });
    return sendSuccess(res, {
      code: "OK",
      message: "All sessions logged out",
      data,
    });
  };

  me = async (req, res) => {
    const data = await AccessService.me({ actor: req.auth });
    return sendSuccess(res, {
      code: "OK",
      message: "Current user",
      data,
    });
  };

  changePassword = async (req, res) => {
    const data = await AccessService.changePassword({
      actor: req.auth,
      oldPassword: req.validated.body.oldPassword,
      newPassword: req.validated.body.newPassword,
      context: this.getContext(req),
    });
    return sendSuccess(res, {
      code: "OK",
      message: "Password changed",
      data,
    });
  };
}

module.exports = new AccessController();
