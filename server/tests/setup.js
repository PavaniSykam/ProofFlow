const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const seed = require('../src/seed/seed');

let mongod;

const setupTestDB = () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    await seed(uri);
  }, 60000);

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
  });
};

module.exports = { setupTestDB };
