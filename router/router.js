"use strict";

const express = require("express");
const router = express.Router();

const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

const { RegisteredUser } = require("./../models/user");

// function checkForBadData(req) {
//   const requiredFields = getRequiredFields();
//
//   let message = "";
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
//   return message;
// }

// Create a user
router.post("/add-user", jsonParser, (req, res) => {
  // let message = checkForBadData(req);
  // if (!(message === "")) {
  //   return res.status(400).send(message);
  // }
  const item = RegisteredUser.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    timestamps: ""
  })
    .then(registeredUser => {
      res.status(201).json(registeredUser);
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({ message: `Internal server error. Record not created. Error: ${err}` });
    });
});

// List all registered users (admins only, eventually, if ever)
router.get("/registered-users", jsonParser, (req, res) => {
  // console.log(req);
  const registeredUsers = RegisteredUser.find()
    .then(registeredUsers => {
      res.json({ registeredUsers });
    })
    .catch(err => {
      console.log("caught an error: ", err);
      res.status(500).json({ message: "Internal server error. Unable to display data." });
    });
  //   .done();
  // console.log(userdudes);
});

// home
router.get("/", jsonParser, (req, res) => {
  console.log(req);
});

module.exports = router;
