const mongoose = require("mongoose");

// const username = encodeURIComponent("uwilinska");
// const password = encodeURIComponent("8V3wYECxKCfYflSQ");
// const cluster = "cluster0.cwimq.mongodb.net";
const dbName = "db-contacts";

const uri = `mongodb+srv://uwilinska:8V3wYECxKCfYflSQ@cluster0.cwimq.mongodb.net/db-contacts?retryWrites=true&w=majority`;

async function connectDB() {
  try {
    await mongoose.connect(uri, { dbName });
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
