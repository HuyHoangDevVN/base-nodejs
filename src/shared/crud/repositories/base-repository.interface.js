"use strict";

/**
 * Documentation-only interface for CRUD repositories.
 *
 * Implementations receive a trusted resource config, normalized query, and ctx.
 * They must never accept table/collection/field names from request payloads.
 */
class BaseCrudRepository {
  findSelect() { throw new Error("findSelect not implemented"); }
  findList() { throw new Error("findList not implemented"); }
  findById() { throw new Error("findById not implemented"); }
  createOne() { throw new Error("createOne not implemented"); }
  createMany() { throw new Error("createMany not implemented"); }
  updateOne() { throw new Error("updateOne not implemented"); }
  updateMany() { throw new Error("updateMany not implemented"); }
  deleteOne() { throw new Error("deleteOne not implemented"); }
  deleteMany() { throw new Error("deleteMany not implemented"); }
  restoreOne() { throw new Error("restoreOne not implemented"); }
  restoreMany() { throw new Error("restoreMany not implemented"); }
  count() { throw new Error("count not implemented"); }
}

module.exports = { BaseCrudRepository };
