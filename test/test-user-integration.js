"use strict";

const chai = require("chai");
const chaiHttp = require("chai-Http");
const faker = require("faker");
const mongoose = require("mongoose");

// make the expect syntax available throughout this module
const expect = chai.expect;

const { Snippet } = require("./../models/snippet.js");
const { RegisteredUser } = require("./../models/user.js");
const { app, runServer, closeServer } = require("../server");
const { TEST_DATABASE_URL } = require("../config");

chai.use(chaiHttp);

// put randomish documents in db for tests.
// use the Faker library to automatically
// generate placeholder values
function seedRegisteredUserData() {
  console.info("seeding RegisteredUser data");
  const seedData = [];

  for (let i = 0; i < 10; i++) {
    seedData.push(generateRegisteredUserData());
  }
  // this will return a promise
  console.log("seedDate: ", seedData);
  return RegisteredUser.insertMany(seedData);
}

// generate an object represnting a registered user.
// can be used to generate seed data for db
// or request.body data
function generateRegisteredUserData() {
  // return {
  //   firstName: faker.name.findName().firstName,
  //   lastName: faker.name.findName().lastName,
  //   email: faker.internet.email(),
  //   password: faker.internet.password(),
  //   createdAt: "",
  //   updatedAt: ""
  // };
  return {
    firstName: "Mary",
    lastName: "Bacon",
    email: "mary.bacon@pork.edu",
    password: "boguspassword1234%$#@!",
    createdAt: "",
    updatedAt: ""
  };
}

// Deletes test database.
// called in `afterEach` block below to ensure data from one test is gone
// before the next test.
function tearDownDb() {
  console.warn("Deleting database");
  // return mongoose.connection.dropDatabase();
}

describe("Write to Speak API resource", function() {
  // Each hook function returns a promise (otherwise we'd need to call a `done` callback).
  // `runServer`, `seedRegisteredUserData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL).catch(err => {
      console.log(err);
    });
  });

  beforeEach(function() {
    return seedRegisteredUserData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  // Tests in nested `describe` blocks.
  describe("GET endpoint", function() {
    it("should return all existing registered users", function() {
      // strategy:
      //    1. get back all registered users returned by GET request to `/`
      //    2. prove res has right status, data type
      //    3. prove the number of registered users we got back is equal to number
      //       in db.
      //
      // need to change and access `res` across `.then()` calls below,
      // so declare it here and modify in place
      console.log("Inside test should return all existing registered users");
      let res;
      return chai
        .request(app)
        .get("/registered-users")
        .then(function(_res) {
          // so subsequent .then blocks can access response object
          res = _res;
          console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ");
          console.log(res.body.registeredUsers);
          console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ");
          expect(res).to.have.status(200);
          // otherwise our db seeding didn't work
          expect(res.body.registeredUsers).to.have.length.of.at.least(1);
          return RegisteredUser.count();
        })
        .then(function(count) {
          console.log("*******************Count: ");
          console.log(count);
          expect(res.body.registeredUsers).to.have.length(count);
        });
    });

    it("should return registered users with right fields", function() {
      // Strategy: Get back all creature sightingss, and ensure they have expected keys

      let resUser;
      return chai
        .request(app)
        .get("/registered-users")
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.registeredUsers).to.be.a("array");
          expect(res.body.registeredUsers).to.have.length.of.at.least(1);

          // res.body
          res.body.registeredUsers.forEach(function(registeredUser) {
            expect(registeredUser).to.be.a("object");
            expect(registeredUser).to.include.keys("_id", "firstName", "lastName", "email", "password", "createdAt", "updatedAt");
          });
          // .catch(err => {
          //   console.log(err);
          // });
          resUser = res.body.registeredUsers[0];
          return RegisteredUser.findById(resUser._id);
        })
        .then(function(registeredUser) {
          console.log("*******************!!!!!!!!!!!************");
          console.log(registeredUser);
          // firstName: faker.name.findName().firstName,
          // lastName: faker.name.findName().lastName,
          // email: faker.internet.email(),
          // password: faker.internet.password()

          expect(resUser._id).to.equal(registeredUser._id.toString());
          expect(resUser.firstName).to.equal(registeredUser.firstName);
          expect(resUser.lastName).to.equal(registeredUser.lastName);
          expect(resUser.email).to.equal(registeredUser.email);
          expect(resUser.password).to.equal(registeredUser.password);
        });
    });
  });
});
