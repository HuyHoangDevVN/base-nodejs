"use strict";

const { NotFoundError } = require("../../../shared/errors/not-found-error");
const { toCohortResponseDto } = require("../mappers/cohort.mapper");

class GetCohortByIdHandler {
  constructor({ repository, policy }) {
    this.repository = repository;
    this.policy = policy;
  }

  async execute(query) {
    this.policy.assertCanRead(query.actor);
    const cohort = await this.repository.findById(query.cohortId);
    if (!cohort) {
      throw new NotFoundError("Cohort not found", "COHORT_NOT_FOUND");
    }
    return toCohortResponseDto(cohort);
  }
}

module.exports = { GetCohortByIdHandler };
