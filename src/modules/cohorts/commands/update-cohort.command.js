"use strict";

const UPDATE_COHORT_COMMAND = "cohort.update";

const updateCohortCommand = ({ actor, cohortId, payload, requestId }) => ({
  type: UPDATE_COHORT_COMMAND,
  actor,
  cohortId,
  payload,
  requestId,
});

module.exports = { UPDATE_COHORT_COMMAND, updateCohortCommand };
