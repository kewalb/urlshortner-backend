const express = require("express");
const env = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/user");
const { google } = require("googleapis");
const router = express.Router();

env.config();

const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URL = process.env.MONGO_URL;
const USERNAME = process.env.GMAILUSERNAME;
const PASSWORD = process.env.PASSWORD;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

// connection to gmail using nodemailer
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  CLIENT_ID, // ClientID
  CLIENT_SECRET, // Client Secret
  "https://developers.google.com/oauthplayground" // Redirect URL
);

oauth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN,
});
const accessToken = oauth2Client.getAccessToken();

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: USERNAME,
    // pass: PASSWORD,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    refreshToken: REFRESH_TOKEN,
    accessToken: accessToken,
    tls: {
      rejectUnauthorized: false,
    },
  },
});

// endpoint for sign up functionality
router.post("/signup", async (request, response) => {
  const { name, email, password } = request.body;
  if (!name || !email || !password) {
    return response.json({ message: "Please fill in all the fields" });
  }
  User.findOne({ email: email }).then((dbUser) => {
    if (dbUser) {
      return response.json({ message: "Try with different email" });
    }
    bcrypt.hash(password, 10).then(async (hashedPassword) => {
      const user = new User({
        name: name,
        email: email,
        password: hashedPassword,
        active: false,
        resetString: null,
        activationToken: null,
        resetToken: null,
        expireToken: null,
      });
      user
        .save()
        .then((user) => {
          // need to add activation logic
          crypto.randomBytes(32, (error, buffer) => {
            if (error) {
              console.log(error);
            }
            const token = buffer.toString("hex");
            user.activationToken = token;
            user.save().then(() => {
              let mailDetails = {
                to: user.email,
                from: "no-replay@insta.com",
                subject: "Activate your account.",
                html: `
                        <p>Click on the below link to activate your account.</p>
                        <h5>click in this <a href="http://localhost:9000/user/activate/${token}">link</a> to activate account.</h5>
                        `,
              };
              mailTransporter.sendMail(mailDetails, function (error, data) {
                if (error) {
                  console.log(error);
                } else {
                  console.log("Email sent successfully");
                }
              });
            });
            response.json({ message: "User created" });
          });
        })
        .catch((error) => console.log(error));
    });
  });
});

// endpoint for login functionality.
router.post("/login", async (request, response) => {
  const { email, password } = request.body;
  if (!email || !password) {
    return response.json({ message: "Please fill out the email and password" });
  }
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return response.json({ message: "Invalid Credentials" });
      }
      if(user.active == false){
          return response.json({ message: "Account not activated"})
      }
      bcrypt.compare(password, user.password).then((match) => {
        if (match) {
          const jwtToken = jwt.sign({ _id: user._id }, JWT_SECRET);
          const { _id, email, name } = user;
          response.json({ jwtToken, name: name, email: email });
        } else {
          return response.json({ message: "Invalid Credentials" });
        }
      });
    })
    .catch((err) => console.log(err));
});

// endpoint for forget password functionality
router.post("/forgot-password", async (request, response) => {
  const { email } = request.body;
  crypto.randomBytes(32, (error, buffer) => {
    if (error) {
      console.log(error);
    }
    const token = buffer.toString("hex");
    User.findOne({ email: email }).then(async (user) => {
      if (!user) {
        return response.json({ message: "Invalid username" });
      }
      user.resetToken = token;
      user.expireToken = Date.now() + 3600000;
      user.save().then((result) => {
        let mailDetails = {
          to: user.email,
          from: "no-replay@insta.com",
          subject: "password reset",
          html: `
                  <p>You requested for password reset</p>
                  <h5>click in this <a href="http://localhost:3000/reset-password-form/${token}">link</a> to reset password</h5>
                  `,
        };
        mailTransporter.sendMail(mailDetails, function (error, data) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent successfully");
          }
        });
        response.json({ message: "Email Sent" });
      });
    });
  });
});

router.post("/new-password", async (request, response) => {
  const { password, token } = request.body;
  User.findOne({ resetToken: token, expireToken: { $gt: Date.now() } })
    .then((user) => {
      if (!user) {
        response.json({ message: "Session expired please try again" });
      }
      bcrypt.hash(password, 12).then(async (hashedpassword) => {
        user.password = hashedpassword;
        user.resetToken = null;
        user.expireToken = null;
        user.save().then(() => {
          response.json({ message: "password updated success" });
        });
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.get("/activate/:token", async (request, response) => {
    const token = request.params.token;
    User.findOne({activationToken: token}).then(user => {
        if(user){
            user.active = true,
            user.activationToken = null
            user.save().then(() => {
                response.send("Account activated please close this page and login to your account")
            })
        }
        else{
            response.send("User not found")
        }
    })
})

module.exports = router;
