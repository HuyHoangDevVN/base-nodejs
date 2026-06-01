"use strict";

const { sendSuccess } = require("../utils/apiResponse");
const { cohortCommandBus, cohortQueryBus } = require("../modules/cohorts");
const { createCohortCommand } = require("../modules/cohorts/commands/create-cohort.command");
const { updateCohortCommand } = require("../modules/cohorts/commands/update-cohort.command");
const {
  deleteCohortCommand,
  deleteManyCohortsCommand,
} = require("../modules/cohorts/commands/delete-cohort.command");
const { getCohortByIdQuery } = require("../modules/cohorts/queries/get-cohort-by-id.query");
const {
  listAllCohortsQuery,
  listCohortOptionsQuery,
  listCohortsQuery,
} = require("../modules/cohorts/queries/list-cohorts.query");

class CohortController {
  getAllCohorts = async (req, res) => {
    const data = await cohortQueryBus.execute(listAllCohortsQuery({
      actor: req.user,
      requestId: req.requestId,
    }));
    return sendSuccess(res, {
      code: "OK",
      message: "Cohorts retrieved",
      data,
    });
  };

  getListCohorts = async (req, res) => {
    const data = await cohortQueryBus.execute(listCohortsQuery({
      actor: req.user,
      filters: req.validated.query,
      requestId: req.requestId,
    }));
    return sendSuccess(res, {
      code: "OK",
      message: "Cohorts retrieved",
      data,
    });
  };

  getCohortById = async (req, res) => {
    const data = await cohortQueryBus.execute(getCohortByIdQuery({
      actor: req.user,
      cohortId: req.validated.params.id,
      requestId: req.requestId,
    }));
    return sendSuccess(res, {
      code: "OK",
      message: "Cohort retrieved",
      data,
    });
  };

  createCohort = async (req, res) => {
    const data = await cohortCommandBus.execute(createCohortCommand({
      actor: req.user,
      payload: req.validated.body,
      requestId: req.requestId,
    }));
    return sendSuccess(res, {
      status: 201,
      code: "CREATED",
      message: "Cohort created",
      data,
    });
  };

  updateCohort = async (req, res) => {
    const data = await cohortCommandBus.execute(updateCohortCommand({
      actor: req.user,
      cohortId: req.validated.params.id,
      payload: req.validated.body,
      requestId: req.requestId,
    }));
    return sendSuccess(res, {
      code: "OK",
      message: "Cohort updated",
      data,
    });
  };

  deleteCohort = async (req, res) => {
    const data = await cohortCommandBus.execute(deleteCohortCommand({
      actor: req.user,
      cohortId: req.validated.params.id,
      requestId: req.requestId,
    }));
    return sendSuccess(res, {
      code: "OK",
      message: "Cohort deleted",
      data,
    });
  };

  deleteManyCohorts = async (req, res) => {
    const data = await cohortCommandBus.execute(deleteManyCohortsCommand({
      actor: req.user,
      cohortIds: req.validated.body.ids,
      requestId: req.requestId,
    }));
    return sendSuccess(res, {
      code: "OK",
      message: "Cohorts deleted",
      data,
    });
  };

  getSelectCohorts = async (req, res) => {
    const data = await cohortQueryBus.execute(listCohortOptionsQuery({
      actor: req.user,
      requestId: req.requestId,
    }));
    return sendSuccess(res, {
      code: "OK",
      message: "Cohort options retrieved",
      data,
    });
  };
}

module.exports = new CohortController();
