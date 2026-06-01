"use strict";

const GET_COHORT_BY_ID_QUERY = "cohort.getById";

const getCohortByIdQuery = ({ actor, cohortId, requestId }) => ({
  type: GET_COHORT_BY_ID_QUERY,
  actor,
  cohortId,
  requestId,
});

module.exports = { GET_COHORT_BY_ID_QUERY, getCohortByIdQuery };
