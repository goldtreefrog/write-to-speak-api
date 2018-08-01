"use strict";

const chai = require("chai");
const chaiHttp = require("chai-Http");
const faker = require("faker");
const mongoose = require("mongoose");
const { Snippet } = require("./../models/snippet.js");
const { app, runServer, closeServer } = require("../server");
const { TEST_DATABASE_URL } = require("../config");

// make the expect syntax available throughout this module
const expect = chai.expect;

chai.use(chaiHttp);

// put randomish documents in db for tests.
// use the Faker library to automatically
// generate placeholder values
function seedSnippetData() {
  console.info("seeding Snippet data");
  const seedData = [];

  for (let i = 0; i < 4; i++) {
    seedData.push(generateSnippetData());
  }
  // this will return a promise
  return Snippet.insertMany(seedData);
}

// generate an object represnting a registered snippet.
// can be used to generate seed data for db
// or request.body data
function generateSnippetData() {
  return {
    owner: faker.name.lastName(),
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
      console.log(err);
    });
  });

  beforeEach(function() {
    return seedSnippetData().catch(err => {
      console.log(err);
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
  describe("Add snippet", function() {
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
          expect(res.body).to.include.keys("_id", "owner", "category", "createdAt", "updatedAt");
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
          return snippet;
        });
    });
  });

  describe("Check Data Integrity", function() {
    it("should not add record without snippetText", function(done) {
      let sendSnippet = {
        owner: faker.name.lastName(),
        category: faker.hacker.noun(),
        snippetOrder: faker.random.number(1000).toString()
      };
      chai
        .request(app)
        .post("/snippets/add-snippet")
        .send(sendSnippet)
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(400);
          expect(res.body).to.be.deep.equal({});
          done();
        });
    });
  });

  describe("update Snippet", function() {
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
});
