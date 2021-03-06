"use strict";

const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { RegisteredUser } = require("./../models/user.js");
const { app, runServer, closeServer } = require("../server");
const { TEST_DATABASE_URL } = require("../config");
const { tearDownDb, seedData } = require("./utils/manage-database.js");

// make the expect syntax available throughout this module
const expect = chai.expect;

chai.use(chaiHttp);

describe("Write to Speak API resource", function() {
  // We need to keep track of some couple of user information so we can log one in and do various tests; otherwise tests will fail with "401 - Unauthorized."
  let rec = []; // User records with unhashed passwords and no create/update values
  const makeUsers = []; // User records with hashed passwords
  let userId; //   UserId that goes with the login token
  let token; //    Value of authToken returned when log user in

  // Each hook function returns a promise (otherwise we'd need to call a `done` callback).
  // `runServer`, `seedSnippetData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL).catch(err => {
      console.log("Error caught in before function: ", err);
    });
  });

  beforeEach(function(done) {
    rec = [
      {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        password: "passwordnbr1",
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
        email: faker.internet.email(),
        password: "passwordnbr2",
        snippets: [
          {
            snippetText: "I love you",
            category: "general",
            snippetOrder: 3
          },
          {
            snippetText: "because I want to",
            category: "general",
            snippetOrder: 2
          }
        ],
        createdAt: "",
        updatedAt: ""
      },
      {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        password: "passwordnbr2",
        snippets: [], // Snippet-less user for certain tests
        createdAt: "",
        updatedAt: ""
      }
    ];

    bcrypt
      .hash(rec[0].password, 12)
      .then(hash => {
        makeUsers.push(
          Object.assign({}, rec[0], {
            password: hash
          })
        );
      })
      .then(() => {
        bcrypt.hash(rec[1].password, 12).then(hash => {
          makeUsers.push(
            Object.assign({}, rec[1], {
              password: hash
            })
          );
          return RegisteredUser.insertMany(makeUsers).then(users => {
            userId = users[1]._id;
            chai
              .request(app)
              .post("/val/auth/login")
              .send({ email: rec[1].email, password: rec[1].password })
              // Logged in. Get token to pass to tests
              .then(res => {
                token = res.body.authToken;
                done();
              });
          });
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

  // Tests in nested `describe` blocks.
  // Note the way done() is used. Thinkful suggested 'return chai...' so you wouldn't have to call done(), but I concluded the weird 404 errors I got on some tests ONLY when running all tests together was due to the tests running asynchronously. The steps within a given test would run in order, but several tests would run at once, so one test would cause the database to be dropped when it finished while other tests were still running. Not good. Works better with done() inside a final .then() - so far...
  describe("GET endpoint - retrieve Snippets", function() {
    it("should retrieve all snippets for all owners who have snippets when no owner specified", function(done) {
      // Get snippets for everyone. Eventually I may rewrite this to allow only administrators to retrieve all snippets, but I might change my mind and allow people to see - and search for - anonymous snippets (so I would have to remove the user info) or perhaps snippets flagged by owners as sharable (with owner credits?), so they can copy them, if I can think of a good use case. If picture symbols were attached, I definitely could...
      chai
        .request(app)
        .get("/snippets/all")
        .set("Authorization", `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.totalSnippets).to.be.at.least(2);
          expect(res.body.usersWithSnippets).to.have.length(2);
          expect(res.body.usersWithSnippets[0].snippets).to.have.length(3);
          expect(res.body.usersWithSnippets[1].snippets).to.have.length(2);
          done();
        });
    });

    it("should retrieve all Snippets for a given owner", function(done) {
      // We saved a specific user ID ("userId") in BeforeEach so that we can check to be sure what the test retrieves is from the SAME user.
      chai
        .request(app)
        .get("/snippets/owner")
        .set("Authorization", `Bearer ${token}`)
        .send({ _id: userId })
        .then(res => {
          expect(res.body).to.have.length(2);
          expect(res.body[0].snippetText).to.equal("I love you");
          done();
        });
    });

    it("should not retrieve any snippets for an owner that does not exist", function(done) {
      chai
        .request(app)
        .get(`/snippets/owner/`)
        .set("Authorization", `Bearer ${token}`)
        .send({ _id: "123456789012" })
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
          .set("Authorization", `Bearer ${token}`)
          .send(sendSnippet)
          .then(res => {
            expect(res).to.have.status(200);
            return sendSnippet.userId;
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
          .set("Authorization", `Bearer ${token}`)
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

  describe("PUT endpoint - ", function() {
    it("should update snippetText", function(done) {
      let updateSnippetTo = {
        snippetText: "Here is the new text for the updated snippet."
      };
      let objSend = {};
      // Find an existing user with snippet(s) for which we will change the first snippet
      RegisteredUser.find({})
        .limit(3)
        .then(users => {
          let i;
          for (i = 0; i < 2; i++) {
            if (users[i].snippetCount && users[i].snippetCount > 0) {
              return users[i];
            }
          }
        })
        .then(user => {
          objSend.userId = user._id;
          updateSnippetTo.category = user.snippets[0].category;
          objSend.snippet = updateSnippetTo;
          objSend.snippet.snippetId = user.snippets[0]._id;

          chai
            .request(app)
            .put("/snippets/update-snippet")
            .set("Authorization", `Bearer ${token}`)
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

    describe("PUT endpoint - remove snippet", function() {
      it("should remove a snippet by snippet id", function(done) {
        // 1. Find any snippets created by beforeEach (which currently creates 4 snippets/user)
        // 2. Remove the second one.
        // 3. Verify that it is gone.

        let origSnippets = [];
        let objSend = {};

        RegisteredUser.find({})
          .limit(5)
          .then(users => {
            let i;
            // Find a user with at least 2 snippets.
            for (i = 0; i < 5; i++) {
              if (users[i].snippetCount && users[i].snippetCount > 1) {
                return users[i];
              }
            }
          })
          .then(user => {
            objSend.userId = user._id;
            origSnippets = user.snippets;
            // Remove the 2nd snippet
            objSend.snippetId = origSnippets[1]._id;
            chai
              .request(app)
              .put("/snippets/delete-snippet")
              .send(objSend)
              .set("Authorization", `Bearer ${token}`)
              .then(res => {
                expect(res).to.have.status(204); // No content
              })
              .then(() => {
                RegisteredUser.findById(objSend.userId)
                  .then(user => {
                    expect(user.snippets.length).to.be.equal(
                      origSnippets.length - 1
                    );
                    expect(JSON.stringify(user.snippets[0])).to.equal(
                      JSON.stringify(origSnippets[0])
                    );
                    expect(JSON.stringify(user.snippets[1])).not.to.equal(
                      JSON.stringify(origSnippets[1])
                    );
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
          {
            category: "virtualTest",
            snippetText: "supercalifragilisticexpialidocis",
            snippetOrder: "1"
          },
          {
            category: "virtualTest",
            snippetText:
              "Just a spoon full of sugar makes the medicine go down",
            snippetOrder: "2"
          },
          {
            category: "virtualTest",
            snippetText: "feed the birds",
            snippetOrder: "3"
          }
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

    it("Finds the maximum snippet order number for a single user", done => {
      RegisteredUser.findOne({})
        .then(user => {
          for (let i = 0; i < parseInt(user.snippetCount, 10); i++) {
            expect(user.maxOrder).to.be.at.least(
              parseInt(user.snippets[i].snippetOrder),
              10
            );
          }
        })
        .then(() => {
          done();
        });
    });
  });
});
