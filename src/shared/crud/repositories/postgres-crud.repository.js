"use strict";

const { Op } = require("sequelize");
const { db, withPostgresTransaction } = require("../../../database/postgres");
const { CrudOperators } = require("../types/crud-operators");

const toPlain = (entity) => entity?.get ? entity.get({ plain: true }) : entity;

const sequelizeOperator = (operator) => ({
  [CrudOperators.EQ]: Op.eq,
  [CrudOperators.NE]: Op.ne,
  [CrudOperators.IN]: Op.in,
  [CrudOperators.NIN]: Op.notIn,
  [CrudOperators.GTE]: Op.gte,
  [CrudOperators.LTE]: Op.lte,
  [CrudOperators.GT]: Op.gt,
  [CrudOperators.LT]: Op.lt,
  [CrudOperators.CONTAINS]: Op.iLike,
  [CrudOperators.STARTS_WITH]: Op.iLike,
}[operator]);

class PostgresCrudRepository {
  constructor({ models = db, transaction = withPostgresTransaction } = {}) {
    this.models = models;
    this.transaction = transaction;
  }

  getModel(config) {
    const model = config.storage.modelName ? this.models[config.storage.modelName] : this.models.sequelize.models[config.storage.table];
    if (!model) throw new Error(`Postgres model not found for ${config.resource}`);
    return model;
  }

  baseWhere(config) {
    if (!config.softDelete.enabled) return {};
    return { [config.softDelete.field]: { [Op.is]: null } };
  }

  buildWhere(config, query = {}) {
    const where = { ...this.baseWhere(config), ...(query.scopeWhere ?? {}) };
    if (query.search && config.fields.searchable.length) {
      where[Op.or] = config.fields.searchable.map((field) => ({
        [field]: { [Op.iLike]: `%${query.searchLike}%` },
      }));
    }
    for (const filter of query.filters ?? []) {
      const op = sequelizeOperator(filter.operator);
      const value = [CrudOperators.CONTAINS, CrudOperators.STARTS_WITH].includes(filter.operator)
        ? `${filter.operator === CrudOperators.STARTS_WITH ? "" : "%"}${String(filter.value).replace(/[\\%_]/g, "\\$&")}%`
        : filter.value;
      where[filter.field] = { [op]: value };
    }
    return where;
  }

  async findSelect(config, query) {
    const rows = await this.getModel(config).findAll({
      attributes: config.fields.selectable,
      where: this.buildWhere(config, query),
      order: query.sort ? [[query.sort.field, query.sort.order]] : undefined,
      limit: query.limit,
      offset: query.offset,
    });
    const [valueField, ...labelFields] = config.fields.selectable;
    return rows.map(toPlain).map((row) => ({
      value: row[valueField],
      label: labelFields.map((field) => row[field]).filter(Boolean).join(" - ") || String(row[valueField]),
      meta: row,
    }));
  }

  async findList(config, query) {
    const result = await this.getModel(config).findAndCountAll({
      attributes: config.fields.readable,
      where: this.buildWhere(config, query),
      order: query.sort ? [[query.sort.field, query.sort.order]] : undefined,
      limit: query.limit,
      offset: query.offset,
    });
    return { rows: result.rows.map(toPlain), total: result.count };
  }

  async findById(config, id, _ctx, options = {}) {
    const where = { [config.storage.primaryKey ?? "id"]: id, ...this.baseWhere(config) };
    const row = await this.getModel(config).findOne({ attributes: config.fields.readable, where, ...options });
    return toPlain(row);
  }

  async createOne(config, data, _ctx, options = {}) {
    return toPlain(await this.getModel(config).create(data, options));
  }

  async createMany(config, dataList, ctx, options = {}) {
    const work = (transaction) => this.getModel(config).bulkCreate(dataList, { returning: true, transaction, ...options });
    const rows = options.transaction ? await work(options.transaction) : await this.transaction(work);
    return rows.map(toPlain);
  }

  async updateOne(config, id, patch, ctx, options = {}) {
    const model = this.getModel(config);
    const row = await model.findOne({ where: { [config.storage.primaryKey ?? "id"]: id, ...this.baseWhere(config) }, ...options });
    if (!row) return null;
    return toPlain(await row.update(patch, options));
  }

  async updateMany(config, patches, ctx, options = {}) {
    const work = async (transaction) => {
      const rows = [];
      for (const item of patches) rows.push(await this.updateOne(config, item.id, item.patch, ctx, { transaction, ...options }));
      return rows.filter(Boolean);
    };
    return options.transaction ? work(options.transaction) : this.transaction(work);
  }

  async deleteOne(config, id, ctx, options = {}) {
    const model = this.getModel(config);
    const row = await model.findOne({ where: { [config.storage.primaryKey ?? "id"]: id, ...this.baseWhere(config) }, ...options });
    if (!row) return null;
    if (config.softDelete.enabled) {
      return toPlain(await row.update({ [config.softDelete.field]: new Date() }, options));
    }
    const plain = toPlain(row);
    await row.destroy(options);
    return plain;
  }

  async deleteMany(config, ids, ctx, options = {}) {
    const work = async (transaction) => {
      const deleted = [];
      for (const id of ids) deleted.push(await this.deleteOne(config, id, ctx, { transaction, ...options }));
      return deleted.filter(Boolean);
    };
    return options.transaction ? work(options.transaction) : this.transaction(work);
  }

  async restoreOne(config, id, ctx, options = {}) {
    if (!config.softDelete.enabled) return null;
    const model = this.getModel(config);
    const row = await model.findOne({ where: { [config.storage.primaryKey ?? "id"]: id }, ...options });
    if (!row) return null;
    return toPlain(await row.update({ [config.softDelete.field]: null }, options));
  }

  async restoreMany(config, ids, ctx, options = {}) {
    const work = async (transaction) => {
      const restored = [];
      for (const id of ids) restored.push(await this.restoreOne(config, id, ctx, { transaction, ...options }));
      return restored.filter(Boolean);
    };
    return options.transaction ? work(options.transaction) : this.transaction(work);
  }

  count(config, query) {
    return this.getModel(config).count({ where: this.buildWhere(config, query) });
  }
}

module.exports = { PostgresCrudRepository, toPlain };
