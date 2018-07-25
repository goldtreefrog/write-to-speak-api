"use strict";

const express = require("express");
const router = express.Router();

const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

const { RegisteredUser } = require("./../models/user");

function checkForBadData(body) {
  //   const requiredFields = getRequiredFields();
  //
  let message = "OK";
  //
  //   for (var k in requiredFields) {
  //     if (requiredFields.hasOwnProperty(k)) {
  //       if (!(k in req.body)) {
  //         message = `Missing \`${k}\` in request body`;
  //       } else {
  //         if (req.body[k].trim() === "") {
  //           message += requiredFields[k] + ", ";
  //         }
  //       }
  //     }
  //   }
  //
  //   if (message > "") {
  //     message = message.slice(0, -2); // remove last comma and space
  //     message = "Please fill in required fields: " + message;
  //   }
  return message;
}

// Create a user
router.post("/add-user", jsonParser, (req, res) => {
  console.log("inside /add-user route with req: ", req.body);
  let message = checkForBadData(req.body);
  if (!(message === "OK")) {
    return res.status(400).send(message);
  }

  let { firstName = "", lastName = "", email, password } = req.body;
  console.log("Whatever: ", firstName, lastName, email, password);

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
      console.log("Going to use: ", firstName, lastName, email, hash);
      return RegisteredUser.create({
        firstName,
        lastName,
        email,
        password: hash,
        timestamps: ""
      });
    })
    .then(registeredUser => {
      return res.status(201).json(registeredUser.serialize());
    })
    .catch(err => {
      // Forward validation errors on to the client, otherwise give a 500
      // error because something unexpected has happened but we don't want to expose
      // info about our system to possibly nefarious users
      if (err.reason === "ValidationError") {
        return res.status(err.code).json(err);
      }
      res.status(500).json({ code: 500, message: "Internal server error" });
    });
  // });
  // const item = RegisteredUser.create({
  //   firstName: req.body.firstName,
  //   lastName: req.body.lastName,
  //   email: req.body.email,
  //   password: req.body.password,
  //   timestamps: ""
  // })
  //   .then(registeredUser => {
  //     res.status(201).json(registeredUser);
  //   })
  //   .catch(function(err) {
  //     console.error(err);
  //     res.status(500).json({ message: `Internal server error. Record not created. Error: ${err}` });
  //   });
});

// List all registered users (admins only, eventually, if ever)
// router.get("/registered-users", jsonParser, (req, res) => {
//   // console.log(req);
//   const registeredUsers = RegisteredUser.find()
//     .select(["firstName", "lastName", "email", "createdAt", "updatedAt"])
//     .then(registeredUsers => {
//       res.json({ registeredUsers });
//     })
//     .catch(err => {
//       console.log("caught an error: ", err);
//       res.status(500).json({ message: "Internal server error. Unable to display data." });
//     });
//   //   .done();
//   // console.log(userdudes);
// });

// home
router.get("/", jsonParser, (req, res) => {
  console.log(req.body);
  res.json("Welcome to Write to Speak");
});

module.exports = router;
