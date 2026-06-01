"use strict";

const { toPagination } = require("../../../shared/utils/pagination");
const { toCohortOptionDto, toCohortResponseDto } = require("../mappers/cohort.mapper");

class ListCohortsHandler {
  constructor({ repository, policy }) {
    this.repository = repository;
    this.policy = policy;
  }

  async execute(query) {
    this.policy.assertCanRead(query.actor);
    const filters = query.filters ?? {};
    const { count, rows } = await this.repository.findPage(filters);

    return {
      items: rows.map(toCohortResponseDto),
      pagination: toPagination({
        page: filters.page,
        limit: filters.limit,
        totalItems: count,
      }),
    };
  }
}

class ListAllCohortsHandler {
  constructor({ repository, policy }) {
    this.repository = repository;
    this.policy = policy;
  }

  async execute(query) {
    this.policy.assertCanRead(query.actor);
    const cohorts = await this.repository.findAll();
    return { items: cohorts.map(toCohortResponseDto) };
  }
}

class ListCohortOptionsHandler {
  constructor({ repository, policy }) {
    this.repository = repository;
    this.policy = policy;
  }

  async execute(query) {
    this.policy.assertCanRead(query.actor);
    const cohorts = await this.repository.findOptions();
    return { items: cohorts.map(toCohortOptionDto) };
  }
}

module.exports = {
  ListCohortsHandler,
  ListAllCohortsHandler,
  ListCohortOptionsHandler,
};
