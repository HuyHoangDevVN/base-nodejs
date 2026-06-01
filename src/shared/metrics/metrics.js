"use strict";

const client = require("prom-client");

client.collectDefaultMetrics({ prefix: "obe_base_" });

const httpRequestDuration = new client.Histogram({
  name: "obe_base_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
});

const httpRequestTotal = new client.Counter({
  name: "obe_base_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const httpErrorTotal = new client.Counter({
  name: "obe_base_http_errors_total",
  help: "Total HTTP error responses",
  labelNames: ["method", "route", "status_code"],
});

const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1_000_000_000;
    const route = req.route?.path || req.path;
    const labels = { method: req.method, route, status_code: String(res.statusCode) };
    httpRequestTotal.inc(labels);
    httpRequestDuration.observe(labels, durationSeconds);
    if (res.statusCode >= 400) httpErrorTotal.inc(labels);
  });
  next();
};

module.exports = {
  client,
  metricsMiddleware,
};
