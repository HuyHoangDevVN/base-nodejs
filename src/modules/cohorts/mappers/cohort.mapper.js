"use strict";

const toPlain = (entity) => {
  if (!entity) return entity;
  if (typeof entity.get === "function") {
    return entity.get({ plain: true });
  }
  return entity;
};

const toCohortResponseDto = (entity) => {
  const cohort = toPlain(entity);
  if (!cohort) return cohort;
  return {
    id: cohort.id,
    code: cohort.code,
    name: cohort.name,
    start_year: cohort.start_year,
    end_year: cohort.end_year,
    created_at: cohort.created_at,
    created_by: cohort.created_by,
    modified_at: cohort.modified_at,
    modified_by: cohort.modified_by,
  };
};

const toCohortOptionDto = (entity) => {
  const cohort = toPlain(entity);
  if (!cohort) return cohort;
  return {
    id: cohort.id,
    code: cohort.code,
    name: cohort.name,
  };
};

module.exports = {
  toCohortResponseDto,
  toCohortOptionDto,
};
