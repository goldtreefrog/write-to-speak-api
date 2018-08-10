"use strict";

const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const mongoose = require("mongoose");
// const { Snippet } = require("./../models/snippet.js");
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
// function generateSnippetData(useOwner) {
//   let owner = useOwner || faker.random.number();
function generateSnippetData() {
  return {
    category: faker.hacker.noun(),
    snippetText: faker.lorem.text(),
    snippetOrder: faker.random.number()
    // createdAt: "",
    // updatedAt: ""
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
  // Note the way done() is used. Thinkful suggested 'return chai...' so you wouldn't have to call done(), but I concluded the weird 404 errors I got on some tests ONLY when running all tests together was due to the tests running asynchronously. The database was getting dropped before the next test finished. Not good. Works better with done() inside a final .then().
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

    // it("should not add a snippet without snippetText", function() {
    //   let sendSnippet = {
    //     owner: faker.name.lastName(),
    //     category: faker.hacker.noun(),
    //     snippetOrder: faker.random.number(1000).toString()
    //   };
    //   return (
    //     chai
    //       .request(app)
    //       .post("/snippets/add-snippet")
    //       .send(sendSnippet)
    //       // .end(function(err, res) {
    //       .then(function(res) {
    //         // expect(err).to.be.null;
    //         expect(res).to.have.status(400);
    //         expect(res.body).to.be.deep.equal({});
    //         // return;
    //       })
    //   );
    // });
  });
  //
  // describe("PUT endpoint - update Snippet", function() {
  //   it("should update snippetText", function() {
  //     let updateSnippet = {
  //       snippetText: faker.lorem.text()
  //     };
  //     let foundSnippet = {};
  //
  //     return Snippet.findOne().then(snippet => {
  //       updateSnippet.id = snippet.id;
  //       foundSnippet.id = snippet.id;
  //       foundSnippet.owner = snippet.owner;
  //       foundSnippet.snippetText = snippet.snippetText;
  //       foundSnippet.category = snippet.category;
  //       return chai
  //         .request(app)
  //         .put(`/snippets/${snippet.id}`)
  //         .send(updateSnippet)
  //         .then(res => {
  //           expect(res).to.have.status(200);
  //           return Snippet.findById(updateSnippet.id);
  //         })
  //         .then(snippet => {
  //           expect(snippet.id).to.equal(foundSnippet.id);
  //           expect(snippet.owner).to.equal(foundSnippet.owner);
  //           expect(snippet.snippetText).to.equal(updateSnippet.snippetText);
  //           expect(snippet.category).to.equal(foundSnippet.category);
  //           expect(snippet.createdAt).to.not.be.null;
  //           expect(snippet.updatedAt).to.not.be.null;
  //         });
  //     });
  //   });
  // });
  //
  // describe("DELETE endpoint - remove snippet", function() {
  //   it("should delete a snippet by id", function() {
  //     let snippet;
  //
  //     // Find any old snippet , then delete it, then verify that it is gone.
  //     return Snippet.findOne()
  //       .then(function(_snippet) {
  //         snippet = _snippet;
  //         return chai.request(app).delete(`/snippets/${snippet.id}`);
  //       })
  //       .then(function(res) {
  //         expect(res).to.have.status(204);
  //         return Snippet.findById(snippet.id);
  //       })
  //       .then(function(_snippet) {
  //         expect(_snippet).to.be.null;
  //       });
  //   });
  // });
});
