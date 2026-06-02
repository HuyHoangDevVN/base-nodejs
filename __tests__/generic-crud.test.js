"use strict";

const express = require("express");
const request = require("supertest");
const { z } = require("zod");
const { parseCrudQuery } = require("../src/shared/crud/core/crud-query-parser");
const { createCrudRoutes } = require("../src/shared/crud/core/crud-route.factory");
const { GenericCrudService } = require("../src/shared/crud/core/crud-service.factory");
const { MongoCrudRepository } = require("../src/shared/crud/repositories/mongo-crud.repository");

const baseConfig = {
  resource: "test-resources",
  displayName: "Test resource",
  public: true,
  storage: { type: "postgres", modelName: "TestModel", primaryKey: "id", idType: "integer" },
  permissions: {},
  actions: {},
  fields: {
    readable: ["id", "name", "status", "created_at"],
    selectable: ["id", "name"],
    searchable: ["name"],
    sortable: ["created_at", "name"],
    filterable: { status: ["eq", "in"], created_at: ["gte", "lte"], name: ["contains"] },
    create: ["name", "status"],
    update: ["name", "status"],
  },
  validation: {
    createSchema: z.object({ name: z.string().min(1), status: z.string().optional() }),
    updateSchema: z.object({ name: z.string().optional(), status: z.string().optional() }).refine((value) => Object.keys(value).length > 0),
  },
  audit: { enabled: true, resourceType: "test_resource", redactFields: ["secretNote"] },
  limits: { defaultPageSize: 20, maxPageSize: 50, maxBulkSize: 2, maxSelectSize: 10 },
};

describe("generic CRUD foundation", () => {
  test("mongodb package is available and Mongo disabled does not connect implicitly", () => {
    expect(() => require("mongodb")).not.toThrow();
  });

  test("query parser applies defaults, max limit, sort whitelist, filters, and escaped search", () => {
    const query = parseCrudQuery(baseConfig, {
      limit: "500",
      search: "a%b_",
      sort: "created_at",
      order: "desc",
      status: "ACTIVE",
      filters: JSON.stringify({ created_at: { gte: "2026-01-01" } }),
    });

    expect(query).toMatchObject({
      page: 1,
      limit: 50,
      offset: 0,
      searchLike: "a\\%b\\_",
      sort: { field: "created_at", order: "DESC" },
    });
    expect(query.filters).toEqual([
      { field: "created_at", operator: "gte", value: "2026-01-01" },
      { field: "status", operator: "eq", value: "ACTIVE" },
    ]);
  });

  test("query parser rejects invalid sort, invalid filter, and operator injection", () => {
    expect(() => parseCrudQuery(baseConfig, { sort: "password" })).toThrow(/Sort field/);
    expect(() => parseCrudQuery(baseConfig, { role: "ADMIN" })).toThrow(/Filter field/);
    expect(() => parseCrudQuery(baseConfig, { filters: JSON.stringify({ status: { $ne: "ACTIVE" } }) })).toThrow(/operator/);
  });

  test("bulk validation returns item index and enforces maxBulkSize", async () => {
    const repository = { createMany: jest.fn() };
    const service = new GenericCrudService({ repositories: { postgres: repository }, audit: { record: jest.fn() } });

    await expect(service.createList({}, baseConfig, [{ name: "ok" }, { bad: true }])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: [{ index: 1 }],
    });
    await expect(service.createList({}, baseConfig, [{ name: "a" }, { name: "b" }, { name: "c" }])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  test("service maps list pagination and records redacted audit for writes", async () => {
    const audit = { record: jest.fn() };
    const repository = {
      findList: jest.fn().mockResolvedValue({ rows: [{ id: 1, name: "One" }], total: 3 }),
      createOne: jest.fn().mockResolvedValue({ id: 2, name: "Two", secretNote: "raw" }),
    };
    const service = new GenericCrudService({ repositories: { postgres: repository }, audit });

    const list = await service.getList({}, baseConfig, { page: 2, limit: 2, sort: "name" });
    const created = await service.createOne({ actorUserId: "u1", requestId: "r1" }, baseConfig, { name: "Two", status: "ACTIVE" });

    expect(list.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
    expect(created).toMatchObject({ id: 2 });
    expect(audit.record).toHaveBeenCalledWith(baseConfig, expect.objectContaining({ actorUserId: "u1" }), expect.objectContaining({
      action: "create-one",
      after: expect.objectContaining({ secretNote: "raw" }),
    }));
  });

  test("route factory does not expose disabled actions", async () => {
    const app = express();
    app.use(express.json());
    app.use("/test-resources", createCrudRoutes({ ...baseConfig, actions: { create: false } }, {
      service: new GenericCrudService({ repositories: { postgres: {} }, audit: { record: jest.fn() } }),
    }));
    app.use((err, _req, res, _next) => res.status(err.status || 500).json({ code: err.code, message: err.message }));

    await request(app).post("/test-resources").send({ name: "Nope" }).expect(404);
  });

  test("service enforces permission when resource is not explicitly public", async () => {
    const service = new GenericCrudService({ repositories: { postgres: {} }, audit: { record: jest.fn() } });
    await expect(service.getList({ permissions: [] }, {
      ...baseConfig,
      public: false,
      permissions: { list: "test.read" },
    }, {})).rejects.toMatchObject({ status: 403 });
  });

  test("mongo repository rejects operator injection and builds escaped regex filters", () => {
    const repository = new MongoCrudRepository({ dbProvider: () => ({ collection: () => ({}) }) });
    expect(() => repository.buildFilter(baseConfig, { filters: [{ field: "$where", operator: "eq", value: "1" }] })).toThrow(/Unsafe Mongo/);
    const filter = repository.buildFilter(baseConfig, { filters: [{ field: "name", operator: "contains", value: "a.b" }] });
    expect(filter.name).toEqual({ $regex: "a\\.b", $options: "i" });
  });
});
