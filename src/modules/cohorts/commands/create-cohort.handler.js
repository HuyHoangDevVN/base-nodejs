"use strict";

const { UniqueConstraintError } = require("sequelize");
const { ConflictError } = require("../../../shared/errors/conflict-error");
const { toCohortResponseDto } = require("../mappers/cohort.mapper");

class CreateCohortHandler {
  constructor({ repository, policy, clock = () => new Date() }) {
    this.repository = repository;
    this.policy = policy;
    this.clock = clock;
  }

  async execute(command) {
    this.policy.assertCanManage(command.actor);
    const now = this.clock();

    try {
      const cohort = await this.repository.transaction((transaction) =>
        this.repository.create(
          {
            ...command.payload,
            created_at: now,
            modified_at: now,
          },
          { transaction }
        )
      );
      return toCohortResponseDto(cohort);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictError("Cohort code already exists", "COHORT_CODE_EXISTS");
      }
      throw error;
    }
  }
}

module.exports = { CreateCohortHandler };
