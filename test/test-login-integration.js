"use strict";

const bcrypt = require("bcrypt");
const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const { TEST_DATABASE_URL } = require("../config");
const { app, runServer, closeServer } = require("../server");
const { tearDownDb } = require("./utils/manage-database.js");
const { RegisteredUser } = require("./../models/user.js");

const expect = chai.expect;

chai.use(chaiHttp);

describe("Write to Speak User Registration", function() {
  let rec = [];
  let makeUsers = [];
  let sendUser;
  let token;

  // Setup and cleanup.
  // Each hook function returns a promise (otherwise we'd need to call a `done` callback).
  before(function() {
    return runServer(TEST_DATABASE_URL).catch(err => {
      console.log("Error caught in before function: ", err);
    });
  });

  beforeEach(function(done) {
    sendUser = {
      email: "testemail@testyincyberspace998.ca",
      password: "bananasRoffwhitewblackseeds"
    };
    rec = [
      {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: sendUser.email,
        password: sendUser.password,
        snippets: [
          {
            snippetText: faker.lorem.text(),
            category: faker.lorem.word(),
            snippetOrder: faker.random.number()
          },
          {
            snippetText: faker.lorem.text(),
            category: faker.lorem.word(),
            snippetOrder: faker.random.number()
          }
        ],
        createdAt: "",
        updatedAt: ""
      },
      {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email,
        password: faker.internet.password,
        snippets: [
          {
            snippetText: faker.lorem.text(),
            category: faker.lorem.word(),
            snippetOrder: faker.random.number()
          },
          {
            snippetText: faker.lorem.text(),
            category: faker.lorem.word(),
            snippetOrder: faker.random.number()
          }
        ],
        createdAt: "",
        updatedAt: ""
      }
    ];

    bcrypt.hash(rec[0].password, 12).then(hash => {
      makeUsers.push(
        Object.assign({}, rec[0], {
          password: hash
        })
      );
      RegisteredUser.insertMany(makeUsers).then(() => {
        done();
      });
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
    // *** except that we already test creating a user in user integration test file. The user would not be logged in at the point where she registers and creates a user record. We could either log her in automatically or ask her to login or send an email link to verify she is real and then present her with the login screen...
    it("Allows a legitimate user to login", function() {
      return chai
        .request(app)
        .post("/val/auth/login")
        .send(sendUser)
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

    it("Allows a user to logout", function(done) {
      // First log in, then log out
      chai
        .request(app)
        .post("/val/auth/login")
        .send(sendUser)
        .then(res => {
          // logged in, now log out
          chai
            .request(app)
            .post("/val/auth/logout")
            .send(sendUser)
            .set("Authorization", `Bearer ${res.body.authToken}`)
            .then(() => {
              RegisteredUser.findOne({ email: sendUser.email })
                .then(user => {
                  expect(user.lastLogout).to.not.be.null;
                  expect(user.lastLogin).to.be.lt(user.lastLogout);
                })
                .then(() => {
                  done();
                });
            });
        });
    });
  });
});
