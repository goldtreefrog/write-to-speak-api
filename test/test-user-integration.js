"use strict";

const chai = require("chai");
const chaiHttp = require("chai-Http");
const faker = require("faker");
const mongoose = require("mongoose");
const { RegisteredUser } = require("./../models/user.js");
const { app, runServer, closeServer } = require("../server");
const { TEST_DATABASE_URL } = require("../config");

// make the expect syntax available throughout this module
const expect = chai.expect;

chai.use(chaiHttp);

// put randomish documents in db for tests. Eventually I will write a test which actually uses this. I had some that I took out (and saved locally), because we do not want anyone to see a list of registered user names and email addresses unless that person is an administrator, and we have not set up an administrator account.
// use the Faker library to automatically
// generate placeholder values
function seedRegisteredUserData() {
  console.info("seeding RegisteredUser data");
  const seedData = [];

  for (let i = 0; i < 10; i++) {
    seedData.push(generateRegisteredUserData());
  }
  // this will return a promise
  // console.log("seedData: ", seedData);
  return RegisteredUser.insertMany(seedData);
}

// generate an object represnting a registered user.
// can be used to generate seed data for db
// or request.body data
function generateRegisteredUserData() {
  return {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    createdAt: "",
    updatedAt: ""
  };
}

function seedSnippetsData() {
  console.info("seeding Snippets data");
  const seedData = [];
  for (let i = 0; i < 20; i++) {
    seedData.push(generateSnippetsData());
  }
}

function generateSnippetsData() {
  return {
    owner: generateOwner(),
    category: faker.lorem.word(),
    snippetOrder: { type: Number, required: true },
    snippetText: { type: String, required: true, trim: true }
  };
}

// Deletes test database.
// called in `afterEach` block below to ensure data from one test is gone
// before the next test.
function tearDownDb() {
  console.warn("Deleting database");
  return mongoose.connection.dropDatabase();
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
    // UNCOMMENT!??
    //   return seedRegisteredUserData().catch(err => {
    //     console.log(err);
    //   });
    return;
  });

  afterEach(function() {
    //  Help?
    console.log("Inside afterEach, in which I should tear down the db, except if I actually do so I get a 'Timeout of 2000ms exceeded' message.");
    // return tearDownDb().catch(err => {
    //   console.log(err);
    // });
    return;
  });

  after(function() {
    return closeServer();
  });

  // Tests in nested `describe` blocks.
  describe("Add user", function() {
    it("should add a user", function() {
      let sendUser = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        password: faker.internet.password()
      };
      // return chai
      let myChai = chai
        .request(app)
        .post("/add-user")
        .send(sendUser)
        .then(function(res) {
          console.log("Just added user. First response: ", res.body);
          expect(res).to.have.status(201);
          expect(res.body).to.be.a("object");
          expect(res.body).to.include.keys("_id", "firstName", "lastName", "email", "createdAt", "updatedAt");
          return res;
        })
        .catch(error => {
          console.log("Got error: ", error);
        })
        .then(res => {
          let createdAt = new Date(res.body.createdAt);
          let updatedAt = new Date(res.body.updatedAt);
          expect(res.body.email).to.equal(sendUser.email);
          expect(res.body.firstName).to.equal(sendUser.firstName);
          expect(res.body.lastName).to.equal(sendUser.lastName);
          expect(createdAt).to.be.a("date");
          expect(createdAt).to.be.lte(updatedAt);
          console.log("Added a user: All is as expected.");
          return res.body._id;
        })
        .catch(error => {
          console.log("Got error: ", error);
        })
        .then(res => {
          console.log("Going to find the user we just added.", res);
          return RegisteredUser.findOne({ _id: res });
        })
        .then(registeredUser => {
          expect(registeredUser).to.not.be.null;
          expect(registeredUser.firstName).to.equal(sendUser.firstName);
          expect(registeredUser.lastName).to.equal(sendUser.lastName);
          expect(registeredUser.email).to.equal(sendUser.email);
          expect(registeredUser.password.length).to.be.gt(sendUser.password.length);
          console.log("We found the user. Now we will validate the password.");
          let match = registeredUser.validatePassword(sendUser.password);
          console.log(match);
          return match;
        })
        .then(passwordValidated => {
          console.log("We checked the password. ", passwordValidated);
          expect(passwordValidated).to.be.true;
        });
    });
  });

  describe("Check Data Integrity", function() {
    it("should not add record without an email", function() {
      let sendUser = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        password: faker.internet.password()
      };
      console.log("!!!!! Test return error if no email: Going to post user: ", sendUser);
      chai
        .request(app)
        .post("/add-user")
        .send(sendUser)
        .catch(error => {
          console.log("Got error (yay!): ", error);
          error.should.be.an("error").and.not.be.null;
        });
    });
    it("should not add a record with both email and password missing", () => {
      let sendUser = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName()
      };
      console.log("! ! Test should return error if neither email nor password: Going to post user: ", sendUser);
      chai
        .request(app)
        .post("/add-user")
        .send(sendUser)
        .then(res => {
          console.log("Not a chai error but: ", res.body);
        })
        .catch(error => {
          console.log("Got error (yay!): ", error);
          error.should.be.an("error").and.not.be.null;
        });
    });
  });
});
