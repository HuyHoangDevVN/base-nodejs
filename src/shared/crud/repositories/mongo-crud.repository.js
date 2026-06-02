"use strict";

const { getMongoDb, withMongoTransaction } = require("../../../database/mongo");
const { CrudOperators } = require("../types/crud-operators");

const SUSPICIOUS_KEY = /(^\$)|(\.)/;

const toObjectId = (config, id) => {
  if (config.storage.idType !== "objectId") return id;
  const { ObjectId } = require("mongodb");
  return new ObjectId(id);
};

const mapMongoDocument = (doc) => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
};

const projectionFor = (fields) => Object.fromEntries(fields.map((field) => [field === "id" ? "_id" : field, 1]));

const mongoOperator = (operator, value) => {
  switch (operator) {
    case CrudOperators.EQ: return value;
    case CrudOperators.NE: return { $ne: value };
    case CrudOperators.IN: return { $in: value };
    case CrudOperators.NIN: return { $nin: value };
    case CrudOperators.GTE: return { $gte: value };
    case CrudOperators.LTE: return { $lte: value };
    case CrudOperators.GT: return { $gt: value };
    case CrudOperators.LT: return { $lt: value };
    case CrudOperators.CONTAINS: return { $regex: value, $options: "i" };
    case CrudOperators.STARTS_WITH: return { $regex: `^${value}`, $options: "i" };
    default: return value;
  }
};

class MongoCrudRepository {
  constructor({ dbProvider = getMongoDb, transaction = withMongoTransaction } = {}) {
    this.dbProvider = dbProvider;
    this.transaction = transaction;
  }

  collection(config) {
    return this.dbProvider().collection(config.storage.collection);
  }

  baseFilter(config) {
    if (!config.softDelete?.enabled) return {};
    return { [config.softDelete.field]: null };
  }

  buildFilter(config, query = {}) {
    const filter = { ...this.baseFilter(config), ...(query.scopeWhere ?? {}) };
    if (query.search && config.fields.searchable.length) {
      filter.$or = config.fields.searchable.map((field) => ({ [field]: { $regex: query.searchRegex, $options: "i" } }));
    }
    for (const item of query.filters ?? []) {
      if (SUSPICIOUS_KEY.test(item.field)) throw new Error("Unsafe Mongo filter field");
      const value = [CrudOperators.CONTAINS, CrudOperators.STARTS_WITH].includes(item.operator)
        ? String(item.value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        : item.value;
      filter[item.field] = mongoOperator(item.operator, value);
    }
    return filter;
  }

  async findSelect(config, query) {
    const docs = await this.collection(config)
      .find(this.buildFilter(config, query), { projection: projectionFor(config.fields.selectable) })
      .sort(query.sort ? { [query.sort.field]: query.sort.order === "DESC" ? -1 : 1 } : {})
      .skip(query.offset)
      .limit(query.limit)
      .toArray();
    const [valueField, ...labelFields] = config.fields.selectable;
    return docs.map(mapMongoDocument).map((row) => ({
      value: row[valueField],
      label: labelFields.map((field) => row[field]).filter(Boolean).join(" - ") || String(row[valueField]),
      meta: row,
    }));
  }

  async findList(config, query) {
    const filter = this.buildFilter(config, query);
    const [rows, total] = await Promise.all([
      this.collection(config)
        .find(filter, { projection: projectionFor(config.fields.readable) })
        .sort(query.sort ? { [query.sort.field]: query.sort.order === "DESC" ? -1 : 1 } : {})
        .skip(query.offset)
        .limit(query.limit)
        .toArray(),
      this.collection(config).countDocuments(filter),
    ]);
    return { rows: rows.map(mapMongoDocument), total };
  }

  async findById(config, id, _ctx, options = {}) {
    return mapMongoDocument(await this.collection(config).findOne(
      { _id: toObjectId(config, id), ...this.baseFilter(config) },
      { projection: projectionFor(config.fields.readable), session: options.session },
    ));
  }

  async createOne(config, data, _ctx, options = {}) {
    const result = await this.collection(config).insertOne(data, { session: options.session });
    return { id: String(result.insertedId), ...data };
  }

  async createMany(config, dataList, ctx, options = {}) {
    const work = async ({ session }) => {
      const result = await this.collection(config).insertMany(dataList, { session });
      return dataList.map((item, index) => ({ id: String(result.insertedIds[index]), ...item }));
    };
    return options.session ? work({ session: options.session }) : this.transaction(work);
  }

  async updateOne(config, id, patch, _ctx, options = {}) {
    const result = await this.collection(config).findOneAndUpdate(
      { _id: toObjectId(config, id), ...this.baseFilter(config) },
      { $set: patch },
      { returnDocument: "after", projection: projectionFor(config.fields.readable), session: options.session },
    );
    return mapMongoDocument(result.value ?? result);
  }

  async updateMany(config, patches, ctx, options = {}) {
    const work = async ({ session }) => {
      const operations = patches.map((item) => ({
        updateOne: {
          filter: { _id: toObjectId(config, item.id), ...this.baseFilter(config) },
          update: { $set: item.patch },
        },
      }));
      await this.collection(config).bulkWrite(operations, { session, ordered: true });
      return Promise.all(patches.map((item) => this.findById(config, item.id, ctx, { session })));
    };
    return options.session ? work({ session: options.session }) : this.transaction(work);
  }

  async deleteOne(config, id, _ctx, options = {}) {
    if (config.softDelete.enabled) {
      return this.updateOne(config, id, { [config.softDelete.field]: new Date() }, {}, options);
    }
    const before = await this.findById(config, id, {}, options);
    if (!before) return null;
    await this.collection(config).deleteOne({ _id: toObjectId(config, id) }, { session: options.session });
    return before;
  }

  async deleteMany(config, ids, ctx, options = {}) {
    const work = async ({ session }) => {
      const before = await Promise.all(ids.map((id) => this.findById(config, id, ctx, { session })));
      if (config.softDelete.enabled) {
        await this.collection(config).updateMany(
          { _id: { $in: ids.map((id) => toObjectId(config, id)) }, ...this.baseFilter(config) },
          { $set: { [config.softDelete.field]: new Date() } },
          { session },
        );
      } else {
        await this.collection(config).deleteMany({ _id: { $in: ids.map((id) => toObjectId(config, id)) } }, { session });
      }
      return before.filter(Boolean);
    };
    return options.session ? work({ session: options.session }) : this.transaction(work);
  }

  async restoreOne(config, id, _ctx, options = {}) {
    if (!config.softDelete.enabled) return null;
    const result = await this.collection(config).findOneAndUpdate(
      { _id: toObjectId(config, id) },
      { $set: { [config.softDelete.field]: null } },
      { returnDocument: "after", projection: projectionFor(config.fields.readable), session: options.session },
    );
    return mapMongoDocument(result.value ?? result);
  }

  async restoreMany(config, ids, ctx, options = {}) {
    const work = async ({ session }) => {
      await this.collection(config).updateMany(
        { _id: { $in: ids.map((id) => toObjectId(config, id)) } },
        { $set: { [config.softDelete.field]: null } },
        { session },
      );
      return Promise.all(ids.map((id) => this.findById(config, id, ctx, { session })));
    };
    return options.session ? work({ session: options.session }) : this.transaction(work);
  }

  count(config, query) {
    return this.collection(config).countDocuments(this.buildFilter(config, query));
  }
}

module.exports = { MongoCrudRepository, mapMongoDocument };
