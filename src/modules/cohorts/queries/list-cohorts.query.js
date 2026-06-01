"use strict";

const LIST_COHORTS_QUERY = "cohort.list";
const LIST_ALL_COHORTS_QUERY = "cohort.listAll";
const LIST_COHORT_OPTIONS_QUERY = "cohort.listOptions";

const listCohortsQuery = ({ actor, filters, requestId }) => ({
  type: LIST_COHORTS_QUERY,
  actor,
  filters,
  requestId,
});

const listAllCohortsQuery = ({ actor, requestId }) => ({
  type: LIST_ALL_COHORTS_QUERY,
  actor,
  requestId,
});

const listCohortOptionsQuery = ({ actor, requestId }) => ({
  type: LIST_COHORT_OPTIONS_QUERY,
  actor,
  requestId,
});

module.exports = {
  LIST_COHORTS_QUERY,
  LIST_ALL_COHORTS_QUERY,
  LIST_COHORT_OPTIONS_QUERY,
  listCohortsQuery,
  listAllCohortsQuery,
  listCohortOptionsQuery,
};
