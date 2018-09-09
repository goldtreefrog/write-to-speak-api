"use strict";

const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const { TEST_DATABASE_URL } = require("../config");
const { app, runServer, closeServer } = require("../server");
const { tearDownDb, seedData } = require("./utils/manage-database.js");

const expect = chai.expect;

chai.use(chaiHttp);

describe("Write to Speak User Registration", function() {
  // Setup and cleanup.
  // Each hook function returns a promise (otherwise we'd need to call a `done` callback).
  before(function() {
    return runServer(TEST_DATABASE_URL).catch(err => {
      console.log("Error caught in before function: ", err);
    });
  });

  beforeEach(function() {
    return seedData().catch(err => {
      console.log("Inside beforeEach, err from seedData(): ", err);
    });
  });

  afterEach(function() {
    return tearDownDb().catch(err => {
      console.log(err);
    });
  });

  after(function() {
    return closeServer();
  });

  // tests
  describe("POST endpoint for login", function() {
    // it("Allows a user to register by creating a user record", function() {
    // *** except that we already test this in user integration test file. The user would not be logged in at the point where she registers and creates a user record. We could either log her in automatically or ask her to login or send an email link to verify she is real and then present her with the login screen...
    //   return chai.request(app).post("");
    // });
    it("Allows a legitimate user to login", function() {
      let password = "bananasRoffwhitewblackseeds";
      let sendUser = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: "testemail@testyincyberspace998.ca",
        password
      };
      return chai
        .request(app)
        .post("/users/add-user")
        .send(sendUser)
        .then(res => {
          return chai
            .request(app)
            .post("/val/auth/login")
            .send({ email: res.body.email, password });
        })
        .then(res => {
          expect(res).to.have.status("200");
          expect(res.body).to.have.all.keys("authToken");
        });
    });

    it("Returns a login error for a user that does not exist", function() {
      return chai
        .request(app)
        .post("/val/auth/login")
        .send({ email: "Iamu@therenow.com", password: "funnything" })
        .then(res => {
          expect(res).to.have.status("401");
        });
    });
  });
});
