const { Sequelize } = require("sequelize");
const { logger } = require("../../shared/logger/logger");
const {
  db: { host, name, port, username, password, dialect },
} = require("../../configs/config.postgre");

const sequelize = new Sequelize(name, username, password, {
  host,
  port,
  dialect,
  logging: process.env.NODE_ENV === "development" ? (message) => logger.debug({ sql: message }, "sequelize_query") : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Định nghĩa model Cohort
db.Cohort = require("./cohort.model")(sequelize, Sequelize);
db.AuthUser = require("./auth-user.model")(sequelize, Sequelize);
db.AuthSession = require("./auth-session.model")(sequelize, Sequelize);
db.AuthRefreshToken = require("./auth-refresh-token.model")(sequelize, Sequelize);
db.Role = require("./role.model")(sequelize, Sequelize);
db.Permission = require("./permission.model")(sequelize, Sequelize);
db.PermissionGroup = require("./permission-group.model")(sequelize, Sequelize);
db.AuthAuditLog = require("./auth-audit-log.model")(sequelize, Sequelize);

Object.assign(db, require("./auth-join.model").defineJoinModels(sequelize, Sequelize));

db.AuthUser.hasMany(db.AuthSession, { foreignKey: "userId", as: "sessions" });
db.AuthSession.belongsTo(db.AuthUser, { foreignKey: "userId", as: "user" });
db.AuthSession.hasMany(db.AuthRefreshToken, { foreignKey: "sessionId", as: "refreshTokens" });
db.AuthRefreshToken.belongsTo(db.AuthSession, { foreignKey: "sessionId", as: "session" });
db.AuthUser.belongsToMany(db.Role, { through: db.UserRole, foreignKey: "userId", otherKey: "roleId", as: "roles" });
db.Role.belongsToMany(db.AuthUser, { through: db.UserRole, foreignKey: "roleId", otherKey: "userId", as: "users" });
db.AuthUser.belongsToMany(db.PermissionGroup, {
  through: db.UserPermissionGroup,
  foreignKey: "userId",
  otherKey: "permissionGroupId",
  as: "directPermissionGroups",
});
db.AuthUser.belongsToMany(db.Permission, {
  through: db.UserPermission,
  foreignKey: "userId",
  otherKey: "permissionId",
  as: "directPermissions",
});
db.Role.belongsToMany(db.PermissionGroup, {
  through: db.RolePermissionGroup,
  foreignKey: "roleId",
  otherKey: "permissionGroupId",
  as: "permissionGroups",
});
db.Role.belongsToMany(db.Permission, {
  through: db.RolePermission,
  foreignKey: "roleId",
  otherKey: "permissionId",
  as: "directPermissions",
});
db.PermissionGroup.belongsToMany(db.Permission, {
  through: db.PermissionGroupPermission,
  foreignKey: "permissionGroupId",
  otherKey: "permissionId",
  as: "permissions",
});

module.exports = db;
