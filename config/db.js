const mongoose = require("mongoose");
require("dotenv").config();

console.log("Process.env:", process.env);

console.log("MongoDB config:");
console.log("MONGO_USERNAME:", process.env.MONGO_USERNAME);
console.log("MONGO_PASSWORD:", process.env.MONGO_PASSWORD);
console.log("MONGO_CLUSTER:", process.env.MONGO_CLUSTER);
console.log("MONGO_DBNAME:", process.env.MONGO_DBNAME);

const username = encodeURIComponent(process.env.MONGO_USERNAME);
const password = encodeURIComponent(process.env.MONGO_PASSWORD);
const cluster = process.env.MONGO_CLUSTER;
const dbName = process.env.MONGO_DBNAME;

const uri = `mongodb+srv://${username}:${password}@${cluster}/${dbName}?retryWrites=true&w=majority`;

async function connectDB() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
}

const Contact = require("../models/contact");

async function testContacts() {
  const contacts = await Contact.find();
  console.log("Contacts in database:", contacts);
}

testContacts();

module.exports = connectDB;
