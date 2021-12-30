// imports.
const express = require("express");
const env = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require('./config/db');
const connecctDB = require("./config/db");

const app = express();

// configure environment variables
env.config();

// connecting to database
connecctDB();

const PORT = process.env.PORT;

app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use('/', require('./routes/urls'))

app.listen(PORT, () => {
  console.log(`Server running at port:${PORT}`);
});
