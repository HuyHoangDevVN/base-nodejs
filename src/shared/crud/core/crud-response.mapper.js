"use strict";

const successEnvelope = (data, { requestId, pagination } = {}) => ({
  success: true,
  data,
  meta: {
    requestId,
    ...(pagination ? { pagination } : {}),
  },
});

const sendCrudSuccess = (res, data, { status = 200, requestId, pagination } = {}) =>
  res.status(status).json(successEnvelope(data, { requestId, pagination }));

module.exports = {
  sendCrudSuccess,
  successEnvelope,
};
