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

// put randomish documents in db for tests.
// use the Faker library to automatically generate placeholder values
function seedSnippetData(owner, nbr) {
  console.info("seeding Snippet data");
  const seedData = [];
  const iterations = nbr || 4;

  for (let i = 0; i < iterations; i++) {
    // seedData.push(generateSnippetData(owner));
    seedData.push(generateSnippetData());
  }
  // this will return a promise
  // return Snippet.insertMany(seedData);
  return RegisteredUser.insertMany({
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    snippets: seedData,
    createdAt: "",
    updatedAt: ""
  });
}

// generate an object represnting a registered snippet.
// can be used to generate seed data for db or request.body data
function generateSnippetData() {
  return {
    category: faker.hacker.noun(),
    snippetText: faker.lorem.text(),
    snippetOrder: faker.random.number()
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
  // `runServer`, `seedSnippetData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL).catch(err => {
      console.log("Error caught in before function: ", err);
    });
  });

  beforeEach(function() {
    return seedSnippetData().catch(err => {
      console.log("Inside beforeEach, err from seedSnippetData(): ", err);
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

  // Tests in nested `describe` blocks.
  // Note the way done() is used. Thinkful suggested 'return chai...' so you wouldn't have to call done(), but I concluded the weird 404 errors I got on some tests ONLY when running all tests together was due to the tests running asynchronously. The steps within a given test would run in order, but several tests would run at once, so one test would cause the database to be dropped when it finished while other tests were still running. Not good. Works better with done() inside a final .then() - so far...
  describe("GET endpoint - retrieve Snippets", function() {
    it("should retrieve all snippets for all owners when no owner specified", function(done) {
      chai
        .request(app)
        .get("/snippets/all")
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res.body).to.have.length.gt(0);
        })
        .then(() => {
          done();
        });
    });

    it("should retrieve all Snippets for a given owner", function(done) {
      RegisteredUser.findOne({}).then(user => {
        chai
          .request(app)
          .get(`/snippets/owner/${user._id}`)
          .then(function(res) {
            expect(res).to.have.status(200);
            expect(res.body).to.have.length.of.at.least(1);
          })
          .then(() => {
            done();
          });
      });
    });

    it("should not retrieve any snippets for an owner that does not exist", function(done) {
      let owner = mongoose.Types.ObjectId("123456789012");
      chai
        .request(app)
        .get(`/snippets/owner/${owner}`)
        .then(function(res) {
          expect(res).to.have.status(404);
        })
        .then(() => {
          done();
        });
    });
  });

  describe("PUT endpoint - add snippet", function() {
    it("should add a snippet to an existing user", function(done) {
      let sendSnippet = {
        category: faker.hacker.noun(),
        snippetText: faker.lorem.text(),
        snippetOrder: faker.random.number(1000).toString()
      };
      // Find an existing user to which we will add a snippet
      RegisteredUser.findOne({}).then(user => {
        let originalSnippetsLength = user.snippets.length;
        sendSnippet.userId = user._id;

        chai
          .request(app)
          .put("/snippets/add-snippet")
          .send(sendSnippet)
          .then(res => {
            return res.body._id;
          })
          .then(id => {
            return RegisteredUser.findById(id);
          })
          .then(user => {
            expect(user).to.not.be.null;
            if (user) {
              expect(user.snippets.length).to.equal(originalSnippetsLength + 1);
            }
          })
          .then(() => {
            done();
          });
      });
    });

    it("should not add a snippet without snippetText", function(done) {
      let sendSnippet = {
        category: faker.hacker.noun(),
        snippetOrder: faker.random.number(1000).toString()
      };
      // Find an existing user to which we will try to add a snippet
      RegisteredUser.findOne({}).then(user => {
        let originalSnippetsLength = user.snippets.length;
        sendSnippet.userId = user._id;

        chai
          .request(app)
          .put("/snippets/add-snippet")
          .send(sendSnippet)
          .then(res => {
            expect(res).to.have.status(400);
            expect(res.body.message.toLowerCase()).to.include("required field");
            expect(res.body.message.toLowerCase()).to.include("missing");
          })
          // Look up original user to see if still has original number of snippets
          .then(() => {
            return RegisteredUser.findById(sendSnippet.userId);
          })
          .then(user => {
            expect(user).to.not.be.null;
            if (user) {
              expect(user.snippets.length).to.equal(originalSnippetsLength);
            }
          })
          .then(() => {
            done();
          });
      });
    });
  });

  describe("PUT endpoint - update Snippet", function() {
    it("should update snippetText", function(done) {
      let updateSnippetTo = {
        snippetText: "Here is the new text for the updated snippet."
      };
      let objSend = {};
      // Find an existing user for which we will change the first snippet
      RegisteredUser.findOne({}).then(user => {
        objSend.userId = user._id;
        objSend.snippetId = user.snippets[0]._id;
        objSend.snippetCategory = updateSnippetTo.category = user.snippets[0].category;
        objSend.origText = user.snippets[0].snippetText;
        objSend.snippet = updateSnippetTo;
        chai
          .request(app)
          .put("/snippets/update-snippet")
          .send(objSend)
          .then(res => {
            expect(res).to.have.status(200);

            let itemText = res.body.map(item => {
              return item["snippetText"];
            });
            expect(itemText).to.include(updateSnippetTo.snippetText);

            let itemCategory = res.body.map(item => {
              return item["category"];
            });
            expect(itemCategory).to.include(updateSnippetTo.category);
          })
          .then(() => done());
      });
    });
    //
    describe("PUT endpoint - remove snippet", function() {
      it("should remove a snippet by snippet id", function(done) {
        // 1. Find any snippets created by beforeEach (which currently creates 4 snippets/user)
        // 2. Remove the second one.
        // 3. Verify that it is gone.

        let origSnippets = [];
        let objSend = {};

        RegisteredUser.findOne({}).then(user => {
          objSend.userId = user._id;
          origSnippets = user.snippets;
          objSend.snippetId = origSnippets[1]._id;
          chai
            .request(app)
            .put("/snippets/delete-snippet")
            .send(objSend)
            // .send({ userId: userId, snippetId: snippetToRemoveId })
            .then(res => {
              expect(res).to.have.status(204); // No content
            })
            .then(() => {
              RegisteredUser.findById(objSend.userId)
                .then(user => {
                  expect(user.snippets.length).to.be.equal(origSnippets.length - 1);
                  expect(JSON.stringify(user.snippets[0])).to.equal(JSON.stringify(origSnippets[0]));
                  expect(JSON.stringify(user.snippets[1])).not.to.equal(JSON.stringify(origSnippets[1]));
                })
                .then(() => done());
            });
        });
      });
    });
  });

  describe("Virtual types", () => {
    it("Sets snippetCount to correct count", done => {
      const testUser = new RegisteredUser({
        firstName: "Mary",
        lastName: "Poppins",
        email: "mary@disneyworldincybertestland.com",
        password: "julieandrews3",
        category: faker.hacker.noun(),
        snippetText: faker.lorem.text(),
        snippetOrder: faker.random.number(),
        snippets: [
          { category: "virtualTest", snippetText: "supercalifragilisticexpialidocis", snippetOrder: "1" },
          { category: "virtualTest", snippetText: "Just a spoon full of sugar makes the medicine go down", snippetOrder: "2" },
          { category: "virtualTest", snippetText: "feed the birds", snippetOrder: "3" }
        ],
        createdAt: "",
        updatedAt: ""
      });
      testUser
        .save()
        .then(() => RegisteredUser.findOne({ lastName: "Poppins" }))
        .then(user => {
          expect(user.snippetCount).to.equal(testUser.snippets.length);
        })
        .then(() => done());
    });
  });
});
