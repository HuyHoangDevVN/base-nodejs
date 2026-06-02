"use strict";

const { CrudAudit } = require("./crud-audit");
const { assertCrudPermission } = require("./crud-permission");
const { parseCrudQuery } = require("./crud-query-parser");
const { notFound } = require("./crud-errors");
const { CrudActions } = require("../types/crud-actions");
const { auditLogService } = require("../../../modules/auth");
const { MongoCrudRepository } = require("../repositories/mongo-crud.repository");
const { PostgresCrudRepository } = require("../repositories/postgres-crud.repository");
const { validateBulkCreatePayload, validateBulkIdsPayload, validateBulkUpdatePayload } = require("../validators/crud-bulk.validator");
const { validateCreatePayload, validateId, validateUpdatePayload } = require("../validators/crud-request.validator");

const paginationMeta = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

const mapByHook = (hook, value) => hook ? hook(value) : value;

class GenericCrudService {
  constructor({ repositories, audit } = {}) {
    this.repositories = repositories ?? {
      postgres: new PostgresCrudRepository(),
      mongo: new MongoCrudRepository(),
    };
    this.audit = audit ?? new CrudAudit({ auditLogService });
  }

  repositoryFor(config) {
    const repository = this.repositories[config.storage.type];
    if (!repository) throw new Error(`CRUD repository not configured for ${config.storage.type}`);
    return repository;
  }

  async scopedQuery(ctx, config, query) {
    if (!config.hooks?.applyOwnershipScope) return query;
    return config.hooks.applyOwnershipScope(ctx, query);
  }

  async getSelect(ctx, config, rawQuery) {
    assertCrudPermission(config, CrudActions.SELECT, ctx);
    const query = await this.scopedQuery(ctx, config, parseCrudQuery(config, rawQuery, { mode: "select" }));
    return this.repositoryFor(config).findSelect(config, query, ctx);
  }

  async getList(ctx, config, rawQuery) {
    assertCrudPermission(config, CrudActions.LIST, ctx);
    const query = await this.scopedQuery(ctx, config, parseCrudQuery(config, rawQuery));
    const result = await this.repositoryFor(config).findList(config, query, ctx);
    return {
      items: result.rows.map((item) => mapByHook(config.hooks?.mapListItem, item)),
      pagination: paginationMeta(query, result.total),
    };
  }

  async getDetail(ctx, config, idParam) {
    assertCrudPermission(config, CrudActions.DETAIL, ctx);
    const id = validateId(config, idParam);
    const entity = await this.repositoryFor(config).findById(config, id, ctx);
    if (!entity) throw notFound(config.displayName, id);
    return mapByHook(config.hooks?.mapDetail, entity);
  }

  async createOne(ctx, config, payload) {
    assertCrudPermission(config, CrudActions.CREATE, ctx);
    const data = await (config.hooks?.beforeCreate?.(ctx, validateCreatePayload(config, payload)) ?? validateCreatePayload(config, payload));
    const entity = await this.repositoryFor(config).createOne(config, data, ctx);
    await config.hooks?.afterCreate?.(ctx, entity);
    await this.audit.record(config, ctx, { action: "create-one", resourceId: entity?.[config.storage.primaryKey ?? "id"] ?? entity?.id, after: entity });
    return mapByHook(config.hooks?.mapDetail, entity);
  }

  async createList(ctx, config, payloadList) {
    assertCrudPermission(config, CrudActions.BULK_CREATE, ctx);
    const items = validateBulkCreatePayload(config, Array.isArray(payloadList) ? payloadList : payloadList?.items);
    const dataList = [];
    for (const item of items) dataList.push(await (config.hooks?.beforeCreate?.(ctx, item) ?? item));
    const entities = await this.repositoryFor(config).createMany(config, dataList, ctx);
    await this.audit.record(config, ctx, { action: "create-list", resourceIds: entities.map((item) => item.id), after: { count: entities.length } });
    return entities.map((item) => mapByHook(config.hooks?.mapListItem, item));
  }

  async updateOne(ctx, config, idParam, payload) {
    assertCrudPermission(config, CrudActions.UPDATE, ctx);
    const id = validateId(config, idParam);
    const before = await this.repositoryFor(config).findById(config, id, ctx);
    if (!before) throw notFound(config.displayName, id);
    const patch = await (config.hooks?.beforeUpdate?.(ctx, id, validateUpdatePayload(config, payload)) ?? validateUpdatePayload(config, payload));
    const entity = await this.repositoryFor(config).updateOne(config, id, patch, ctx);
    await config.hooks?.afterUpdate?.(ctx, entity);
    await this.audit.record(config, ctx, { action: "update-one", resourceId: id, before, after: entity });
    return mapByHook(config.hooks?.mapDetail, entity);
  }

  async updateList(ctx, config, payloadList) {
    assertCrudPermission(config, CrudActions.BULK_UPDATE, ctx);
    const patches = validateBulkUpdatePayload(config, Array.isArray(payloadList) ? payloadList : payloadList?.items);
    const prepared = [];
    for (const item of patches) {
      prepared.push({ id: item.id, patch: await (config.hooks?.beforeUpdate?.(ctx, item.id, item.patch) ?? item.patch) });
    }
    const entities = await this.repositoryFor(config).updateMany(config, prepared, ctx);
    await this.audit.record(config, ctx, { action: "update-list", resourceIds: prepared.map((item) => item.id), after: { count: entities.length } });
    return entities.map((item) => mapByHook(config.hooks?.mapListItem, item));
  }

  async deleteOne(ctx, config, idParam) {
    assertCrudPermission(config, CrudActions.DELETE, ctx);
    const id = validateId(config, idParam);
    await config.hooks?.beforeDelete?.(ctx, id);
    const before = await this.repositoryFor(config).deleteOne(config, id, ctx);
    if (!before) throw notFound(config.displayName, id);
    await config.hooks?.afterDelete?.(ctx, before);
    await this.audit.record(config, ctx, { action: "delete-one", resourceId: id, before });
    return { id };
  }

  async deleteList(ctx, config, body) {
    assertCrudPermission(config, CrudActions.BULK_DELETE, ctx);
    const ids = validateBulkIdsPayload(config, body?.ids ?? body);
    const deleted = await this.repositoryFor(config).deleteMany(config, ids, ctx);
    await this.audit.record(config, ctx, { action: "delete-list", resourceIds: ids, before: { count: deleted.length } });
    return { ids, deletedCount: deleted.length };
  }

  async restoreOne(ctx, config, idParam) {
    assertCrudPermission(config, CrudActions.RESTORE, ctx);
    const id = validateId(config, idParam);
    const entity = await this.repositoryFor(config).restoreOne(config, id, ctx);
    if (!entity) throw notFound(config.displayName, id);
    await this.audit.record(config, ctx, { action: "restore-one", resourceId: id, after: entity });
    return mapByHook(config.hooks?.mapDetail, entity);
  }

  async restoreList(ctx, config, body) {
    assertCrudPermission(config, CrudActions.BULK_RESTORE, ctx);
    const ids = validateBulkIdsPayload(config, body?.ids ?? body);
    const entities = await this.repositoryFor(config).restoreMany(config, ids, ctx);
    await this.audit.record(config, ctx, { action: "restore-list", resourceIds: ids, after: { count: entities.length } });
    return entities.map((item) => mapByHook(config.hooks?.mapListItem, item));
  }
}

const createCrudService = (options) => new GenericCrudService(options);

module.exports = {
  GenericCrudService,
  createCrudService,
};
