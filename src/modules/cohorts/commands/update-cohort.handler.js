"use strict";

const { UniqueConstraintError } = require("sequelize");
const { ConflictError } = require("../../../shared/errors/conflict-error");
const { NotFoundError } = require("../../../shared/errors/not-found-error");
const { toCohortResponseDto } = require("../mappers/cohort.mapper");

class UpdateCohortHandler {
  constructor({ repository, policy, clock = () => new Date() }) {
    this.repository = repository;
    this.policy = policy;
    this.clock = clock;
  }

  async execute(command) {
    this.policy.assertCanManage(command.actor);

    try {
      const cohort = await this.repository.transaction(async (transaction) => {
        const found = await this.repository.findById(command.cohortId, { transaction });
        if (!found) {
          throw new NotFoundError("Cohort not found", "COHORT_NOT_FOUND");
        }

        await found.update(
          {
            ...command.payload,
            modified_at: this.clock(),
          },
          { transaction }
        );

        return found;
      });
      return toCohortResponseDto(cohort);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictError("Cohort code already exists", "COHORT_CODE_EXISTS");
      }
      throw error;
    }
  }
}

module.exports = { UpdateCohortHandler };
