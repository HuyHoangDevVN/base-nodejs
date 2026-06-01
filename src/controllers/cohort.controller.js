"use strict";

const CohortService = require("../services/cohort.service");
const { sendSuccess } = require("../utils/apiResponse");

class CohortController {
  getAllCohorts = async (req, res) => {
    const data = await CohortService.getAllCohorts();
    return sendSuccess(res, {
      code: "OK",
      message: "Cohorts retrieved",
      data,
    });
  };

  getListCohorts = async (req, res) => {
    const data = await CohortService.getListCohorts(req.validated.query);
    return sendSuccess(res, {
      code: "OK",
      message: "Cohorts retrieved",
      data,
    });
  };

  getCohortById = async (req, res) => {
    const data = await CohortService.getCohortById(req.validated.params.id);
    return sendSuccess(res, {
      code: "OK",
      message: "Cohort retrieved",
      data,
    });
  };

  createCohort = async (req, res) => {
    const data = await CohortService.createCohort(req.validated.body);
    return sendSuccess(res, {
      status: 201,
      code: "CREATED",
      message: "Cohort created",
      data,
    });
  };

  updateCohort = async (req, res) => {
    const data = await CohortService.updateCohort(req.validated.params.id, req.validated.body);
    return sendSuccess(res, {
      code: "OK",
      message: "Cohort updated",
      data,
    });
  };

  deleteCohort = async (req, res) => {
    const data = await CohortService.deleteCohort(req.validated.params.id);
    return sendSuccess(res, {
      code: "OK",
      message: "Cohort deleted",
      data,
    });
  };

  deleteManyCohorts = async (req, res) => {
    const data = await CohortService.deleteManyCohorts(req.validated.body.ids);
    return sendSuccess(res, {
      code: "OK",
      message: "Cohorts deleted",
      data,
    });
  };

  getSelectCohorts = async (req, res) => {
    const data = await CohortService.getSelectCohorts();
    return sendSuccess(res, {
      code: "OK",
      message: "Cohort options retrieved",
      data,
    });
  };
}

module.exports = new CohortController();
