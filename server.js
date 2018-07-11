"use strict";

// Setup
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { DATABASE_URL, PORT } = require("./config");
// Make Mongoose use ES6 promises rather than Mongoose's own
mongoose.Promise = global.Promise;

const app = express();

app.use(bodyParser.json());

// let server = app.listen(PORT, () => {
//   console.log(`Your app is listening on port ${PORT}`);
// });

// this function connects to our database, then starts the server
function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app
        .listen(port, () => {
          console.log(`Your app is listening on port ${port}`);
          resolve();
        })
        .on("error", err => {
          reject(err);
        });
    });
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