"use strict";

const { env } = require("../configs/env");

let mongoClient;
let mongoDb;

const connectMongo = async ({ uri = env.MONGO_URI, dbName = env.MONGO_DB_NAME } = {}) => {
  if (mongoDb) return mongoDb;
  if (!env.MONGO_ENABLED_BOOL) {
    throw new Error("MongoDB is disabled. Set MONGO_ENABLED=true to use Mongo resources.");
  }
  if (!uri || !dbName) {
    throw new Error("MongoDB is not configured. Set MONGO_URI and MONGO_DB_NAME.");
  }
  const { MongoClient } = require("mongodb");
  mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  mongoDb = mongoClient.db(dbName);
  return mongoDb;
};

const getMongoDb = () => {
  if (!mongoDb) {
    throw new Error("MongoDB has not been connected");
  }
  return mongoDb;
};

const disconnectMongo = async () => {
  if (!mongoClient) return;
  await mongoClient.close();
  mongoClient = undefined;
  mongoDb = undefined;
};

const withMongoTransaction = async (fn) => {
  if (!mongoClient) return fn({ session: undefined, transactionAvailable: false });
  const session = mongoClient.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn({ session, transactionAvailable: true });
    });
    return result;
  } finally {
    await session.endSession();
  }
};

module.exports = {
  connectMongo,
  disconnectMongo,
  getMongoDb,
  withMongoTransaction,
};
