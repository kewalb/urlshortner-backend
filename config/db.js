const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const MONGO_URL = process.env.MONGO_URL

const connecctDB = async () => {
  try {
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database Connected");
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

module.exports = connecctDB;
