"use strict";

const CREATE_COHORT_COMMAND = "cohort.create";

const createCohortCommand = ({ actor, payload, requestId }) => ({
  type: CREATE_COHORT_COMMAND,
  actor,
  payload,
  requestId,
});

module.exports = { CREATE_COHORT_COMMAND, createCohortCommand };
