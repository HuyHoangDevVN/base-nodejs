"use strict";

const { createCrudService } = require("./crud-service.factory");
const { sendCrudSuccess } = require("./crud-response.mapper");

const contextFromRequest = (req) => ({
  actorUserId: req.auth?.id ?? req.user?.id,
  authUserId: req.auth?.id,
  roles: req.auth?.roles ?? (req.user?.role ? [req.user.role] : []),
  permissions: req.user?.permissions ?? [],
  requestId: req.requestId,
  ip: req.ip,
  userAgent: req.get("user-agent"),
  sessionId: req.auth?.sessionId,
  user: req.user,
});

const createCrudController = (config, { service = createCrudService() } = {}) => ({
  getSelect: async (req, res) => sendCrudSuccess(res, await service.getSelect(contextFromRequest(req), config, req.query), { requestId: req.requestId }),
  getList: async (req, res) => {
    const data = await service.getList(contextFromRequest(req), config, req.query);
    return sendCrudSuccess(res, data.items, { requestId: req.requestId, pagination: data.pagination });
  },
  getDetail: async (req, res) => sendCrudSuccess(res, await service.getDetail(contextFromRequest(req), config, req.params.id), { requestId: req.requestId }),
  createOne: async (req, res) => sendCrudSuccess(res, await service.createOne(contextFromRequest(req), config, req.body), { status: 201, requestId: req.requestId }),
  createList: async (req, res) => sendCrudSuccess(res, await service.createList(contextFromRequest(req), config, req.body), { status: 201, requestId: req.requestId }),
  updateOne: async (req, res) => sendCrudSuccess(res, await service.updateOne(contextFromRequest(req), config, req.params.id, req.body), { requestId: req.requestId }),
  updateList: async (req, res) => sendCrudSuccess(res, await service.updateList(contextFromRequest(req), config, req.body), { requestId: req.requestId }),
  deleteOne: async (req, res) => sendCrudSuccess(res, await service.deleteOne(contextFromRequest(req), config, req.params.id), { requestId: req.requestId }),
  deleteList: async (req, res) => sendCrudSuccess(res, await service.deleteList(contextFromRequest(req), config, req.body), { requestId: req.requestId }),
  restoreOne: async (req, res) => sendCrudSuccess(res, await service.restoreOne(contextFromRequest(req), config, req.params.id), { requestId: req.requestId }),
  restoreList: async (req, res) => sendCrudSuccess(res, await service.restoreList(contextFromRequest(req), config, req.body), { requestId: req.requestId }),
});

module.exports = {
  contextFromRequest,
  createCrudController,
};
