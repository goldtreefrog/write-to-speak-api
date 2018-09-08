"use strict";

// Setup
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser"); // Use in routers.
const mongoose = require("mongoose");
const morgan = require("morgan");
const passport = require("passport");
const cors = require("cors");
const {
  DATABASE_URL,
  PORT,
  PASSPORT_CONFIG,
  CLIENT_ORIGIN
} = require("./config");
const usersRouter = require("./router/usersRouter");
const snippetsRouter = require("./router/snippetsRouter");
const { router: authRouter, localStrategy, jwtStrategy } = require("./auth");

// Make Mongoose use ES6 promises rather than Mongoose's own
mongoose.Promise = global.Promise;

const app = express();

// //Log all requests
// // app.all("/", logRequest);
// app.use(morgan("common"));
// Log requests to console
app.use(morgan("dev"));

// cors
app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);
app.use("/users/", usersRouter);
app.use("/snippets/", snippetsRouter);
app.use("/val/auth/", authRouter);

// app.use(bodyParser.json()); // Do we need this here?  It is in the routers.

// // The line of code commented out below is from a tutorial on JWT and Passport I found online: https://blog.slatepeak.com/creating-a-simple-node-express-api-authentication-system-with-passport-and-jwt/
// // I may not need it.
// // "When you submit form data with a POST request, that form data can be encoded in many ways. The default type for HTML forms is application/x-www-urlencoded, but you can also submit data as JSON or any other arbitrary format.
// // "bodyParser.urlencoded() provides middleware for automatically parsing forms with the content-type application/x-www-urlencoded and storing the result as a dictionary (object) in req.body. The body-parser module also provides middleware for parsing JSON, plain text, or just returning a raw Buffer object for you to deal with as needed."
// // from https://www.reddit.com/r/learnprogramming/comments/2qr8om/nodejs_why_do_we_need_body_parser_urlencoded_in/
app.use(bodyParser.urlencoded({ extended: false }));

// // initialize passport for use - WHY?
// app.use(passport.initialize());

const jwtAuth = passport.authenticate("jwt", { session: false });

// closeServer needs access to a server object, but that only
// gets created when `runServer` runs, so we declare `server` here
// and then assign a value to it in run
let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(
        databaseUrl,
        { useNewUrlParser: true }
      )
      .then(
        () => {
          let now = new Date();
          server = app
            .listen(port, () => {
              console.log(`Your gorgeous app is listening on port ${port} on ${now}`);
              resolve();
            })
            .on("error", err => {
              reject(err);
            });
        },
        err => {
          return reject(err);
        }

        let now = new Date();
        server = app
          .listen(port, () => {
            console.log(
              `Your gorgeous app is listening on port ${port} on ${now}`
            );
            resolve();
          })
          .on("error", err => {
            reject(err);
          });
      }
    );
  });
}

// this function closes the server, and returns a promise.
// used in our integration tests.
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log("Closing server");
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs - see https://nodejs.org/api/modules.html#modules_accessing_the_main_module.
// We also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { runServer, app, closeServer };
