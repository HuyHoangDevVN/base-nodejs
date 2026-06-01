"use strict";

const { NotFoundError } = require("../../../shared/errors/not-found-error");

class DeleteCohortHandler {
  constructor({ repository, policy }) {
    this.repository = repository;
    this.policy = policy;
  }

  async execute(command) {
    this.policy.assertCanManage(command.actor);

    return this.repository.transaction(async (transaction) => {
      const cohort = await this.repository.findById(command.cohortId, { transaction });
      if (!cohort) {
        throw new NotFoundError("Cohort not found", "COHORT_NOT_FOUND");
      }

      await cohort.destroy({ transaction });
      return { id: command.cohortId };
    });
  }
}

class DeleteManyCohortsHandler {
  constructor({ repository, policy }) {
    this.repository = repository;
    this.policy = policy;
  }

  async execute(command) {
    this.policy.assertCanManage(command.actor);

    return this.repository.transaction(async (transaction) => {
      const deletedCount = await this.repository.destroyMany(command.cohortIds, { transaction });
      if (deletedCount === 0) {
        throw new NotFoundError("No cohorts found to delete", "COHORT_NOT_FOUND");
      }

      return {
        deletedIds: command.cohortIds,
        deletedCount,
      };
    });
  }
}

module.exports = {
  DeleteCohortHandler,
  DeleteManyCohortsHandler,
};
