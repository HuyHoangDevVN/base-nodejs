"use strict";

const { Op } = require("sequelize");
const db = require("../../../models/postgreSQL");

class CohortRepository {
  constructor({ Cohort = db.Cohort, sequelize = db.sequelize } = {}) {
    this.Cohort = Cohort;
    this.sequelize = sequelize;
  }

  transaction(work) {
    return this.sequelize.transaction(work);
  }

  findAll() {
    return this.Cohort.findAll({
      order: [["created_at", "DESC"]],
    });
  }

  findOptions() {
    return this.Cohort.findAll({
      attributes: ["id", "code", "name"],
      order: [["name", "ASC"]],
    });
  }

  findById(id, options = {}) {
    return this.Cohort.findByPk(id, options);
  }

  findPage({ page, limit, search, sort, order }) {
    const offset = (page - 1) * limit;
    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { code: { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    return this.Cohort.findAndCountAll({
      where,
      order: [[sort, order]],
      limit,
      offset,
    });
  }

  create(payload, options = {}) {
    return this.Cohort.create(payload, options);
  }

  destroyMany(ids, options = {}) {
    return this.Cohort.destroy({
      where: { id: { [Op.in]: ids } },
      ...options,
    });
  }
}

module.exports = { CohortRepository };
