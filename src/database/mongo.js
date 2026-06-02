"use strict";

let mongoClient;
let mongoDb;

const connectMongo = async ({ uri = process.env.MONGO_URI, dbName = process.env.MONGO_DB_NAME } = {}) => {
  if (mongoDb) return mongoDb;
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
  getMongoDb,
  withMongoTransaction,
};
