"use strict";

const express = require("express");
const router = express.Router();

const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

const { RegisteredUser } = require("./../models/user");

function getRequiredFields() {
  // The value is the user-friendly value we pass back, if we were going to do it that way, but here we have no reason to do so because we own front and back ends but just in case...
  return {
    email: "Email",
    password: "Password"
  };
}

function checkForBadData(body) {
  const requiredFields = getRequiredFields();
  console.log(requiredFields);
  let message = "";

  for (var k in requiredFields) {
    if (requiredFields.hasOwnProperty(k)) {
      if (!(k in body)) {
        console.log("missing field: ", requiredFields[k]);
        message += requiredFields[k] + ", ";
      } else {
        if (body[k].trim() === "") {
          console.log("blank field: ", requiredFields[k]);
          message += requiredFields[k] + ", ";
        }
      }
    }
  }

  if (message > "") {
    message = message.slice(0, -2); // remove last comma and space
    // message = "Please correct: " + message;
    message = `Please correct: Required field(s) - ${message} - is(/are) missing from request body.`;
  }
  return message;
}

// Create a user
router.post("/add-user", jsonParser, (req, res) => {
  console.log("inside /add-user route with req: ", req.body);
  let message = checkForBadData(req.body);
  if (!(message === "")) {
    console.log("Error message returned from checkForBadData: ", message);
    return res.status(400).send(message);
  }

  let { firstName = "", lastName = "", email, password } = req.body;
  console.log("Request fields: ", firstName, lastName, email, password);

  return RegisteredUser.find({ email })
    .count()
    .then(count => {
      if (count > 0) {
        // User already exists
        console.log(firstName, lastName, email, password, " already exists; well, email does, anyway.");
        return Promise.reject({
          code: 422,
          reason: "ValidationError",
          message: "Email already in use. Did you forget your password?",
          location: "email"
        });
      }
      // Before adding the user, hash the password
      return RegisteredUser.hashPassword(password);
    })
    .then(hash => {
      console.log("It was hashed to: ", hash);
      console.log("In router.js, about to create: ", firstName, lastName, email, hash);
      return RegisteredUser.create({
        firstName,
        lastName,
        email,
        password: hash,
        timestamps: ""
      });
    })
    .then(registeredUser => {
      console.log("Message from router.js: So it got created?");
      return res.status(201).json(registeredUser.serialize());
    })
    .catch(err => {
      // Forward validation errors on to the client, otherwise give a 500
      // error because something unexpected has happened but we don't want to expose
      // info about our system to possibly nefarious users
      console.log("Uh oh!", err);
      if (err.reason === "ValidationError") {
        return res.status(err.code).json(err);
      }
      res.status(500).json({ code: 500, message: "Internal server error" });
    });
});

// home
router.get("/", jsonParser, (req, res) => {
  // console.log(req.body);
  res.json("Welcome to Write to Speak");
});

module.exports = router;
