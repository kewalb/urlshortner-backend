const jwt = require("jsonwebtoken");
// const { JWT_SECRET } = require("../config/keys");
const mongoose = require("mongoose");
const User = require("../models/user");
const env = require('dotenv')

env.config();
const JWT_SECRET = process.env.JWT_SECRET;


// custom middleware to check if a user is loggged in or not.
module.exports = (request, response, next) => {
  const { authorization } = request.headers;
  
  if (!authorization) {
    return response.status(401).json({message: "Please log in to continue" });
  }
  const token = authorization.replace("Bearer ", "");
  jwt.verify(token, JWT_SECRET, (error, payload) => {
    if (error) {
      return response.status(401).json({ error: "Please log in to continue" });
    }

    const { _id } = payload;
    User.findById(_id).then((userdata) => {
      request.user = userdata;
      next();
    });
  });
};
