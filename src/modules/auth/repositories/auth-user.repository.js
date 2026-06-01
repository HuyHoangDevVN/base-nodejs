"use strict";

const { Op } = require("sequelize");
const db = require("../../../models/postgreSQL");

class AuthUserRepository {
  constructor({ AuthUser = db.AuthUser, Role = db.Role, Permission = db.Permission, PermissionGroup = db.PermissionGroup } = {}) {
    this.AuthUser = AuthUser;
    this.Role = Role;
    this.Permission = Permission;
    this.PermissionGroup = PermissionGroup;
  }

  findByIdentifier(identifier) {
    return this.AuthUser.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { username: identifier }, { employeeCode: identifier }],
      },
    });
  }

  findById(id, options = {}) {
    return this.AuthUser.findByPk(id, options);
  }

  list({ page = 1, limit = 20, search = "", status } = {}) {
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { username: { [Op.iLike]: `%${search}%` } },
        { employeeCode: { [Op.iLike]: `%${search}%` } },
        { displayName: { [Op.iLike]: `%${search}%` } },
      ];
    }
    return this.AuthUser.findAndCountAll({
      where,
      attributes: { exclude: ["passwordHash"] },
      order: [["created_at", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });
  }

  findByIdWithAuthGraph(id) {
    return this.AuthUser.findByPk(id, {
      include: [
        {
          model: this.Role,
          as: "roles",
          through: { attributes: ["expiresAt"] },
          include: [
            { model: this.Permission, as: "directPermissions", through: { attributes: [] } },
            {
              model: this.PermissionGroup,
              as: "permissionGroups",
              through: { attributes: [] },
              include: [{ model: this.Permission, as: "permissions", through: { attributes: [] } }],
            },
          ],
        },
        {
          model: this.PermissionGroup,
          as: "directPermissionGroups",
          through: { attributes: ["expiresAt", "reason"] },
          include: [{ model: this.Permission, as: "permissions", through: { attributes: [] } }],
        },
        { model: this.Permission, as: "directPermissions", through: { attributes: ["expiresAt", "reason"] } },
      ],
    });
  }

  findDuplicateIdentity({ email, username, employeeCode }) {
    const clauses = [];
    if (email) clauses.push({ email });
    if (username) clauses.push({ username });
    if (employeeCode) clauses.push({ employeeCode });
    if (clauses.length === 0) return null;
    return this.AuthUser.findOne({ where: { [Op.or]: clauses } });
  }

  create(payload, options = {}) {
    return this.AuthUser.create(payload, options);
  }

  updateById(id, payload, options = {}) {
    return this.AuthUser.update(payload, { where: { id }, ...options });
  }
}

module.exports = { AuthUserRepository };
