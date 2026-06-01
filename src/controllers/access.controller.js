"use strict";

const AccessService = require("../services/access.service");
const { sendSuccess } = require("../utils/apiResponse");

class AccessController {
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
    const data = await AccessService.login(req.validated.body);
    return sendSuccess(res, {
      code: "OK",
      message: "Login successful",
      data,
    });
  };

  refresh = async (req, res) => {
    const data = await AccessService.refresh(req.validated.body);
    return sendSuccess(res, {
      code: "OK",
      message: "Token refreshed",
      data,
    });
  };

  logout = async (req, res) => {
    const data = await AccessService.logout(req.validated.body || {});
    return sendSuccess(res, {
      code: "OK",
      message: "Logout successful",
      data,
    });
  };

  me = async (req, res) => sendSuccess(res, {
    code: "OK",
    message: "Current user",
    data: { user: req.user },
  });
}

module.exports = new AccessController();
