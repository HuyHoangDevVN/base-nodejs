"use strict";

const express = require("express");
const cohortController = require("../../controllers/cohort.controller");
const { asyncHandler } = require("../../middlewares/asyncHandler");
const { authenticate, optionalReadAuth, requirePermission } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const {
  idParams,
  listQuery,
  cohortCreateBody,
  cohortUpdateBody,
  deleteManyBody,
} = require("../../validators/cohort.validator");

const router = express.Router();
const canCreateCohorts = [authenticate, requirePermission("academic.cohort.create")];
const canUpdateCohorts = [authenticate, requirePermission("academic.cohort.update")];
const canDeleteCohorts = [authenticate, requirePermission("academic.cohort.delete")];

// RESTful API.
router.get("/cohorts", optionalReadAuth, validate({ query: listQuery }), asyncHandler(cohortController.getListCohorts));
router.get("/cohorts/options", optionalReadAuth, asyncHandler(cohortController.getSelectCohorts));
router.get("/cohorts/:id", optionalReadAuth, validate({ params: idParams }), asyncHandler(cohortController.getCohortById));
router.post("/cohorts", ...canCreateCohorts, validate({ body: cohortCreateBody }), asyncHandler(cohortController.createCohort));
router.patch("/cohorts/:id", ...canUpdateCohorts, validate({ params: idParams, body: cohortUpdateBody }), asyncHandler(cohortController.updateCohort));
router.put("/cohorts/:id", ...canUpdateCohorts, validate({ params: idParams, body: cohortUpdateBody }), asyncHandler(cohortController.updateCohort));
router.delete("/cohorts/bulk", ...canDeleteCohorts, validate({ body: deleteManyBody }), asyncHandler(cohortController.deleteManyCohorts));
router.delete("/cohorts/:id", ...canDeleteCohorts, validate({ params: idParams }), asyncHandler(cohortController.deleteCohort));

// Backward-compatible aliases for existing clients. These should be removed after FE migrates.
router.get("/cohort/get-all", optionalReadAuth, asyncHandler(cohortController.getAllCohorts));
router.get("/cohort/get-list", optionalReadAuth, validate({ query: listQuery }), asyncHandler(cohortController.getListCohorts));
router.get("/cohort/get-select", optionalReadAuth, asyncHandler(cohortController.getSelectCohorts));
router.get("/cohort/:id", optionalReadAuth, validate({ params: idParams }), asyncHandler(cohortController.getCohortById));
router.post("/cohort", ...canCreateCohorts, validate({ body: cohortCreateBody }), asyncHandler(cohortController.createCohort));
router.patch("/cohort/:id", ...canUpdateCohorts, validate({ params: idParams, body: cohortUpdateBody }), asyncHandler(cohortController.updateCohort));
router.put("/cohort/:id", ...canUpdateCohorts, validate({ params: idParams, body: cohortUpdateBody }), asyncHandler(cohortController.updateCohort));
router.delete("/cohort", ...canDeleteCohorts, validate({ body: deleteManyBody }), asyncHandler(cohortController.deleteManyCohorts));
router.delete("/cohort/:id", ...canDeleteCohorts, validate({ params: idParams }), asyncHandler(cohortController.deleteCohort));

module.exports = router;
