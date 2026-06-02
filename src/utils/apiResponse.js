"use strict";

const sendSuccess = (res, { status = 200, code = "OK", message = "Success", data = null, meta = {}, pagination }) =>
  res.status(status).json({
    success: true,
    code,
    message,
    data,
    meta: {
      requestId: res.req?.requestId,
      ...(pagination ? { pagination } : {}),
      ...meta,
    },
  });

module.exports = { sendSuccess };
