"use strict";

const mapCohort = (entity) => entity ? ({
  id: entity.id,
  code: entity.code,
  name: entity.name,
  start_year: entity.start_year,
  end_year: entity.end_year,
  created_at: entity.created_at,
  created_by: entity.created_by,
  modified_at: entity.modified_at,
  modified_by: entity.modified_by,
}) : null;

module.exports = { mapCohort };
