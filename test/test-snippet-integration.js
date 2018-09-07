"use strict";

const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const mongoose = require("mongoose");
const { Snippet } = require("./../models/snippet.js");
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
    seedData.push(generateSnippetData(owner));
  }
  console.log("seedData records: ", seedData.length);
  // this will return a promise
  return Snippet.insertMany(seedData);
}

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
  describe("GET endpoint - retrieve Snippets", function() {
    it("should retrieve all snippets for all owners when no owner specified", function() {
      return chai
        .request(app)
        .get("/snippets/all")
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res.body).to.have.length.gt(0);
          // return;
        });
    });

    it("should retrieve all Snippets for a given owner", function() {
      let owner = "1234567";
      seedSnippetData(owner, 10);
      return (
        chai
          .request(app)
          .get(`/snippets/${owner}`)
          // .end(function(err, res) {
          .then(function(res) {
            expect(res).to.have.status(200);
            expect(res.body).to.have.length.of.at.least(10);
            // return;
          })
      );
    });

    it("should not retrieve any snippets for an owner that does not exist", function() {
      let owner = "1";
      return chai
        .request(app)
        .get(`/snippets/${owner}`)
        .then(function(res) {
          expect(res).to.have.status(404);
        });
    });
  });

  describe("POST endpoint - add snippet", function() {
    it("should add a snippet", function() {
      let sendSnippet = {
        owner: faker.name.lastName(),
        category: faker.hacker.noun(),
        snippetText: faker.lorem.text(),
        snippetOrder: faker.random.number(1000).toString()
      };
      return chai
        .request(app)
        .post("/snippets/add-snippet")
        .send(sendSnippet)
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.a("object");
          expect(res.body).to.include.keys(
            "_id",
            "owner",
            "category",
            "createdAt",
            "updatedAt"
          );
          return res;
        })
        .then(res => {
          let createdAt = new Date(res.body.createdAt);
          let updatedAt = new Date(res.body.updatedAt);
          expect(res.body.category).to.equal(sendSnippet.category);
          expect(res.body.owner).to.equal(sendSnippet.owner);
          expect(res.body.lastName).to.equal(sendSnippet.lastName);
          expect(createdAt).to.be.a("date");
          expect(createdAt).to.be.lte(updatedAt);
          return res.body._id;
        })
        .then(res => {
          return Snippet.findOne({ _id: res });
        })
        .then(snippet => {
          expect(snippet).to.not.be.null;
          expect(snippet.owner).to.equal(sendSnippet.owner);
          expect(snippet.lastName).to.equal(sendSnippet.lastName);
          expect(snippet.category).to.equal(sendSnippet.category);
          expect(snippet.snippetText).to.equal(sendSnippet.snippetText);
          // return snippet;
        });
    });

    it("should not add record without snippetText", function() {
      let sendSnippet = {
        owner: faker.name.lastName(),
        category: faker.hacker.noun(),
        snippetOrder: faker.random.number(1000).toString()
      };
      return (
        chai
          .request(app)
          .post("/snippets/add-snippet")
          .send(sendSnippet)
          // .end(function(err, res) {
          .then(function(res) {
            // expect(err).to.be.null;
            expect(res).to.have.status(400);
            expect(res.body).to.be.deep.equal({});
            // return;
          })
      );
    });
  });

  describe("PUT endpoint - update Snippet", function() {
    it("should update snippetText", function() {
      let updateSnippet = {
        snippetText: faker.lorem.text()
      };
      let foundSnippet = {};

      return Snippet.findOne().then(snippet => {
        updateSnippet.id = snippet.id;
        foundSnippet.id = snippet.id;
        foundSnippet.owner = snippet.owner;
        foundSnippet.snippetText = snippet.snippetText;
        foundSnippet.category = snippet.category;
        return chai
          .request(app)
          .put(`/snippets/${snippet.id}`)
          .send(updateSnippet)
          .then(res => {
            expect(res).to.have.status(200);
            return Snippet.findById(updateSnippet.id);
          })
          .then(snippet => {
            expect(snippet.id).to.equal(foundSnippet.id);
            expect(snippet.owner).to.equal(foundSnippet.owner);
            expect(snippet.snippetText).to.equal(updateSnippet.snippetText);
            expect(snippet.category).to.equal(foundSnippet.category);
            expect(snippet.createdAt).to.not.be.null;
            expect(snippet.updatedAt).to.not.be.null;
          });
      });
    });
  });

  describe("DELETE endpoint - remove snippet", function() {
    it("should delete a snippet by id", function() {
      let snippet;

      // Find any old snippet , then delete it, then verify that it is gone.
      return Snippet.findOne()
        .then(function(_snippet) {
          snippet = _snippet;
          return chai.request(app).delete(`/snippets/${snippet.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Snippet.findById(snippet.id);
        })
        .then(function(_snippet) {
          expect(_snippet).to.be.null;
        });
    });
  });
});
