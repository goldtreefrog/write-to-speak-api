"use strict";

// Setup
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const { DATABASE_URL, PORT, CLIENT_ORIGIN } = require("./config");
const logRequest = require("./log-request"); // Log requests
const usersRouter = require("./router/usersRouter");
const snippetsRouter = require("./router/snippetsRouter");

// Make Mongoose use ES6 promises rather than Mongoose's own
mongoose.Promise = global.Promise;

const app = express();

// Log all requests
app.all("/", logRequest);

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);
app.use("/users/", usersRouter);
app.use("/snippets/", snippetsRouter);
app.use(bodyParser.json());

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
      );

    // err => {
    //   console.log("err ===", err);
    //   if (err) {
    //     return reject(err);
    //   }
    //   let now = new Date();
    //   server = app
    //     .listen(port, () => {
    //       console.log(`Your gorgeous app is listening on port ${port} on ${now}`);
    //       resolve();
    //     })
    //     .on("error", err => {
    //       reject(err);
    //     });
    // }
    // );
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
