"use strict";

const DELETE_COHORT_COMMAND = "cohort.delete";
const DELETE_MANY_COHORTS_COMMAND = "cohort.deleteMany";

const deleteCohortCommand = ({ actor, cohortId, requestId }) => ({
  type: DELETE_COHORT_COMMAND,
  actor,
  cohortId,
  requestId,
});

const deleteManyCohortsCommand = ({ actor, cohortIds, requestId }) => ({
  type: DELETE_MANY_COHORTS_COMMAND,
  actor,
  cohortIds,
  requestId,
});

module.exports = {
  DELETE_COHORT_COMMAND,
  DELETE_MANY_COHORTS_COMMAND,
  deleteCohortCommand,
  deleteManyCohortsCommand,
};
