"use strict";

const { UniqueConstraintError } = require("sequelize");
const { Roles } = require("../src/constants/roles");
const { CreateCohortHandler } = require("../src/modules/cohorts/commands/create-cohort.handler");
const { DeleteCohortHandler } = require("../src/modules/cohorts/commands/delete-cohort.handler");
const { GetCohortByIdHandler } = require("../src/modules/cohorts/queries/get-cohort-by-id.handler");
const { ListCohortsHandler } = require("../src/modules/cohorts/queries/list-cohorts.handler");
const { CohortPolicy } = require("../src/modules/cohorts/policies/cohort.policy");

const admin = { id: "admin-1", role: Roles.ADMIN };
const user = { id: "user-1", role: Roles.USER };

const asModel = (data) => ({
  ...data,
  get: () => data,
});

describe("cohort CQRS handlers", () => {
  test("list query returns mapped rows with pagination", async () => {
    const repository = {
      findPage: jest.fn().mockResolvedValue({
        count: 21,
        rows: [asModel({ id: 1, code: "K50", name: "Cohort 50", start_year: 2026 })],
      }),
    };
    const handler = new ListCohortsHandler({ repository, policy: new CohortPolicy() });

    const result = await handler.execute({
      actor: undefined,
      filters: { page: 2, limit: 10, search: "", sort: "created_at", order: "DESC" },
    });

    expect(repository.findPage).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: "",
      sort: "created_at",
      order: "DESC",
    });
    expect(result).toMatchObject({
      items: [{ id: 1, code: "K50", name: "Cohort 50" }],
      pagination: { page: 2, limit: 10, totalItems: 21, totalPages: 3 },
    });
  });

  test("get by id query throws domain not found error", async () => {
    const handler = new GetCohortByIdHandler({
      repository: { findById: jest.fn().mockResolvedValue(null) },
      policy: new CohortPolicy(),
    });

    await expect(handler.execute({ actor: undefined, cohortId: 999 })).rejects.toMatchObject({
      status: 404,
      code: "COHORT_NOT_FOUND",
    });
  });

  test("create command enforces admin policy", async () => {
    const handler = new CreateCohortHandler({
      repository: { transaction: jest.fn(), create: jest.fn() },
      policy: new CohortPolicy(),
    });

    await expect(handler.execute({ actor: user, payload: { code: "K50" } })).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });

  test("create command maps unique constraint to conflict error", async () => {
    const repository = {
      transaction: jest.fn(async (work) => work("tx")),
      create: jest.fn().mockRejectedValue(new UniqueConstraintError({ errors: [] })),
    };
    const handler = new CreateCohortHandler({
      repository,
      policy: new CohortPolicy(),
      clock: () => new Date("2026-01-01T00:00:00.000Z"),
    });

    await expect(handler.execute({ actor: admin, payload: { code: "K50" } })).rejects.toMatchObject({
      status: 409,
      code: "COHORT_CODE_EXISTS",
    });
  });

  test("delete command destroys inside transaction", async () => {
    const destroy = jest.fn();
    const repository = {
      transaction: jest.fn(async (work) => work("tx")),
      findById: jest.fn().mockResolvedValue({ destroy }),
    };
    const handler = new DeleteCohortHandler({ repository, policy: new CohortPolicy() });

    const result = await handler.execute({ actor: admin, cohortId: 7 });

    expect(repository.findById).toHaveBeenCalledWith(7, { transaction: "tx" });
    expect(destroy).toHaveBeenCalledWith({ transaction: "tx" });
    expect(result).toEqual({ id: 7 });
  });
});
