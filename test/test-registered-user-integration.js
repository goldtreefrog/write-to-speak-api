"use strict";

const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const mongoose = require("mongoose");
const { RegisteredUser } = require("./../models/user.js");
const { app, runServer, closeServer } = require("../server");
const { TEST_DATABASE_URL } = require("../config");

// make the expect syntax available throughout this module
const expect = chai.expect;

chai.use(chaiHttp);

// generate an object representing a registered user.
// can be used to generate seed data for db
// or request.body data
// function generateRegisteredUserData() {
//   return {
//     firstName: faker.name.firstName(),
//     lastName: faker.name.lastName(),
//     email: faker.internet.email(),
//     password: faker.internet.password(),
//     createdAt: "",
//     updatedAt: ""
//   };
// }

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

  // beforeEach(function() {
  // Do not use unless you actually want to display masses of user data in the API, which I do not.
  //   return seedRegisteredUserData().catch(err => {
  //     console.log(err);
  //   });
  // });

  afterEach(function() {
    return tearDownDb().catch(err => {
      console.log(err);
    });
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
      return chai
        .request(app)
        .post("/users/add-user")
        .send(sendUser)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res.body).to.be.a("object");
          expect(res.body).to.include.keys("_id", "firstName", "lastName", "email", "createdAt", "updatedAt");
          return res;
        })
        .then(res => {
          let createdAt = new Date(res.body.createdAt);
          let updatedAt = new Date(res.body.updatedAt);
          expect(res.body.email).to.equal(sendUser.email);
          expect(res.body.firstName).to.equal(sendUser.firstName);
          expect(res.body.lastName).to.equal(sendUser.lastName);
          expect(createdAt).to.be.a("date");
          expect(createdAt).to.be.lte(updatedAt);
          return res.body._id;
        })
        .then(res => {
          return RegisteredUser.findOne({ _id: res });
        })
        .then(registeredUser => {
          expect(registeredUser).to.not.be.null;
          expect(registeredUser.firstName).to.equal(sendUser.firstName);
          expect(registeredUser.lastName).to.equal(sendUser.lastName);
          expect(registeredUser.email).to.equal(sendUser.email);
          expect(registeredUser.password.length).to.be.gt(sendUser.password.length);
          let match = registeredUser.validatePassword(sendUser.password);
          return match;
        })
        .then(passwordValidated => {
          expect(passwordValidated).to.be.true;
        });
    });
  });

  describe("Check Data Integrity", function() {
    it("should not add record without an email", function(done) {
      let sendUser = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        password: faker.internet.password(),
        createdAt: "",
        updatedAt: ""
      };
      chai
        .request(app)
        .post("/users/add-user")
        .send(sendUser)
        .end(function(err, res) {
          expect(res).to.have.status(400);
          expect(res.body).to.be.deep.equal({});
          done();
        });
    });
    it("should not add a record with password missing", () => {
      let sendUser = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        createdAt: "",
        updatedAt: ""
      };
      chai
        .request(app)
        .post("/users/add-user")
        .send(sendUser)
        .end(function(err, res) {
          expect(res.error).to.have.status(400);
          expect(res.body).to.be.deep.equal({});
        });
    });
  });
});
