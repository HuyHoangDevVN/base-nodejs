"use strict";

const { CommandBus } = require("../../shared/cqrs/command-bus");
const { QueryBus } = require("../../shared/cqrs/query-bus");
const { CohortRepository } = require("./repositories/cohort.repository");
const { CohortPolicy } = require("./policies/cohort.policy");
const { CREATE_COHORT_COMMAND } = require("./commands/create-cohort.command");
const { UPDATE_COHORT_COMMAND } = require("./commands/update-cohort.command");
const { DELETE_COHORT_COMMAND, DELETE_MANY_COHORTS_COMMAND } = require("./commands/delete-cohort.command");
const { GET_COHORT_BY_ID_QUERY } = require("./queries/get-cohort-by-id.query");
const {
  LIST_ALL_COHORTS_QUERY,
  LIST_COHORT_OPTIONS_QUERY,
  LIST_COHORTS_QUERY,
} = require("./queries/list-cohorts.query");
const { CreateCohortHandler } = require("./commands/create-cohort.handler");
const { UpdateCohortHandler } = require("./commands/update-cohort.handler");
const { DeleteCohortHandler, DeleteManyCohortsHandler } = require("./commands/delete-cohort.handler");
const { GetCohortByIdHandler } = require("./queries/get-cohort-by-id.handler");
const {
  ListAllCohortsHandler,
  ListCohortOptionsHandler,
  ListCohortsHandler,
} = require("./queries/list-cohorts.handler");

const cohortRepository = new CohortRepository();
const cohortPolicy = new CohortPolicy();

const cohortCommandBus = new CommandBus()
  .register(CREATE_COHORT_COMMAND, new CreateCohortHandler({ repository: cohortRepository, policy: cohortPolicy }))
  .register(UPDATE_COHORT_COMMAND, new UpdateCohortHandler({ repository: cohortRepository, policy: cohortPolicy }))
  .register(DELETE_COHORT_COMMAND, new DeleteCohortHandler({ repository: cohortRepository, policy: cohortPolicy }))
  .register(
    DELETE_MANY_COHORTS_COMMAND,
    new DeleteManyCohortsHandler({ repository: cohortRepository, policy: cohortPolicy })
  );

const cohortQueryBus = new QueryBus()
  .register(GET_COHORT_BY_ID_QUERY, new GetCohortByIdHandler({ repository: cohortRepository, policy: cohortPolicy }))
  .register(LIST_COHORTS_QUERY, new ListCohortsHandler({ repository: cohortRepository, policy: cohortPolicy }))
  .register(LIST_ALL_COHORTS_QUERY, new ListAllCohortsHandler({ repository: cohortRepository, policy: cohortPolicy }))
  .register(
    LIST_COHORT_OPTIONS_QUERY,
    new ListCohortOptionsHandler({ repository: cohortRepository, policy: cohortPolicy })
  );

module.exports = {
  cohortCommandBus,
  cohortQueryBus,
};
