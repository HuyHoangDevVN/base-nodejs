"use strict";

const db = require("../models/postgreSQL");
const { AppError } = require("../errors/AppError");
const Cohort = db.Cohort;
const { Op, UniqueConstraintError } = require("sequelize");

const toPagination = ({ page, limit, totalItems }) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.ceil(totalItems / limit),
});

class CohortService {
  static getAllCohorts = async () => {
    const cohorts = await Cohort.findAll({
      order: [["created_at", "DESC"]],
    });
    return { items: cohorts };
  };

  static getListCohorts = async ({ page = 1, limit = 20, search = "", sort = "created_at", order = "DESC" }) => {
    const offset = (page - 1) * limit;
    const whereCondition = search
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { code: { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    const { count, rows } = await Cohort.findAndCountAll({
      where: whereCondition,
      order: [[sort, order]],
      limit,
      offset,
    });

    return {
      items: rows,
      pagination: toPagination({ page, limit, totalItems: count }),
    };
  };

  static getCohortById = async (id) => {
    const cohort = await Cohort.findByPk(id);
    if (!cohort) {
      throw new AppError("Cohort not found", {
        status: 404,
        code: "COHORT_NOT_FOUND",
      });
    }

    return cohort;
  };

  static createCohort = async (data) => {
    try {
      return await db.sequelize.transaction(async (transaction) =>
        Cohort.create(
          {
            ...data,
            created_at: new Date(),
            modified_at: new Date(),
          },
          { transaction }
        )
      );
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new AppError("Cohort code already exists", {
          status: 409,
          code: "COHORT_CODE_EXISTS",
        });
      }
      throw error;
    }
  };

  static updateCohort = async (id, data) => {
    try {
      return await db.sequelize.transaction(async (transaction) => {
        const cohort = await Cohort.findByPk(id, { transaction });
        if (!cohort) {
          throw new AppError("Cohort not found", {
            status: 404,
            code: "COHORT_NOT_FOUND",
          });
        }

        await cohort.update(
          {
            ...data,
            modified_at: new Date(),
          },
          { transaction }
        );

        return cohort;
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new AppError("Cohort code already exists", {
          status: 409,
          code: "COHORT_CODE_EXISTS",
        });
      }
      throw error;
    }
  };

  static deleteCohort = async (id) =>
    db.sequelize.transaction(async (transaction) => {
      const cohort = await Cohort.findByPk(id, { transaction });
      if (!cohort) {
        throw new AppError("Cohort not found", {
          status: 404,
          code: "COHORT_NOT_FOUND",
        });
      }

      await cohort.destroy({ transaction });
      return { id };
    });

  static deleteManyCohorts = async (ids) =>
    db.sequelize.transaction(async (transaction) => {
      const deletedCount = await Cohort.destroy({
        where: { id: { [Op.in]: ids } },
        transaction,
      });

      if (deletedCount === 0) {
        throw new AppError("No cohorts found to delete", {
          status: 404,
          code: "COHORT_NOT_FOUND",
        });
      }

      return {
        deletedIds: ids,
        deletedCount,
      };
    });

  static getSelectCohorts = async () => {
    const cohorts = await Cohort.findAll({
      attributes: ["id", "code", "name"],
      order: [["name", "ASC"]],
    });

    return { items: cohorts };
  };
}

module.exports = CohortService;
