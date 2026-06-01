"use strict";

const sendSuccess = (res, { status = 200, code = "OK", message = "Success", data = null }) =>
  res.status(status).json({
    success: true,
    code,
    message,
    data,
  });

module.exports = { sendSuccess };
