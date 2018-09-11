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

function generateRandomNumber(lowN, highN) {
  // Math.random() produces a random number from 0 to 1 (but excluding 1).
  // Mutliply that by the difference from low to high.
  // So far you have the right distance between low and high but you are starting at 0.
  // Add the low number to that so you start from the low number instead of 0.
  // Math.ceil() rounds up so you only have integers. (.floor() rounds down/truncates)
  return Math.ceil(Math.random() * (highN - lowN) + lowN);
}

// put randomish documents in db for tests.
// use the Faker library to automatically generate placeholder values
const seedData = (owner, nbr) => {
  const ownerData = [];
  const users = [];

  if (owner) {
    let finishedUsers = RegisteredUser.hashPassword(owner.password).then(
      function(hash) {
        users.push({
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
          password: hash,
          snippets: [],
          createdAt: "",
          updatedAt: ""
        });
        console
          .log(
            "Dddddddddduhhh users!!!!! manage-database return users: ",
            users
          )
          .then(function(res) {
            resolve(res.users);
          });
      }
    );
  } else {
    // We put one user at the front with no snippets. More are added further below.
    RegisteredUser.hashPassword(faker.internet.password()).then(function(hash) {
      users.push({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        password: hash,
        snippets: [],
        createdAt: "",
        updatedAt: ""
      });
    });

    // Add more users and give them some snippets
    let maxSnippets;
    for (let i = 0; i < 4; i++) {
      maxSnippets = generateRandomNumber(0, 6);
      const seedSnippetData = [];
      for (let j = 0; j < maxSnippets; j++) {
        seedSnippetData.push(generateSnippetData());
      }
      RegisteredUser.hashPassword(faker.internet.password()).then(function(
        hash
      ) {
        users.push({
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
          email: faker.internet.email(),
          password: hash,
          snippets: seedSnippetData,
          createdAt: "",
          updatedAt: ""
        });
        return users;
      });
    }
    return users;
  }
};

// generate an object represnting a registered snippet.
// can be used to generate seed data for db or request.body data
function generateSnippetData(useOwner) {
  let owner = useOwner || faker.name.lastName();
  return {
    owner,
    category: faker.hacker.noun(),
    snippetText: faker.lorem.text(),
    snippetOrder: faker.random.number(),
    createdAt: "",
    updatedAt: ""
  };
}

module.exports = { tearDownDb, seedData };
