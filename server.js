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
const {
  router: authRouter,
  localStrategy,
  jwtStrategy,
  jwtAuth
} = require("./auth");

// Make Mongoose use ES6 promises rather than Mongoose's own
mongoose.Promise = global.Promise;

const app = express();

// cors
app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);

// Log requests to console
app.use(morgan("dev"));

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

app.use(bodyParser.urlencoded({ extended: false }));

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
              console.log(
                `Your gorgeous app is listening on port ${port} on ${now}`
              );
              resolve();
            })
            .on("error", err => {
              reject(err);
            });
        },
        err => {
          return reject(err);
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
