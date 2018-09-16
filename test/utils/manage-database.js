"use strict";

const faker = require("faker");
const mongoose = require("mongoose");
const { Snippet } = require("./../../models/snippetSchema.js");
const { RegisteredUser } = require("./../../models/user.js");

// Deletes test database.
// called in `afterEach` blocks to ensure data from one test is gone
// before the next test.
function tearDownDb() {
  console.warn("Deleting database");
  return mongoose.connection.dropDatabase();
}

module.exports = { tearDownDb };
