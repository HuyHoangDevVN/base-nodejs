"use strict";

const express = require("express");
const router = express.Router();

router.use(require("./health"));

router.use("/v1/api", require("./access"));
router.use("/api/v1", require("./access"));
router.use("/v1/api", require("./admin-auth"));
router.use("/api/v1", require("./admin-auth"));

router.use("/v1/api", require("./cohort"));
router.use("/api/v1", require("./cohort"));
router.use("/v1/api/academic-cohorts", require("../modules/academic-cohorts/academic-cohort.routes"));
router.use("/api/v1/academic-cohorts", require("../modules/academic-cohorts/academic-cohort.routes"));
router.use("/v1/api/system-logs", require("../modules/system-logs/system-log.routes"));
router.use("/api/v1/system-logs", require("../modules/system-logs/system-log.routes"));

module.exports = router;
