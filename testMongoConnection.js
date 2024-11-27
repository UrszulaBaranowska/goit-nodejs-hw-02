const mongoose = require("mongoose");



const uri = `mongodb+srv://uwilinska:8V3wYECxKCfYflSQ@cluster0.cwimq.mongodb.net/db-contacts?retryWrites=true&w=majority`;

async function testConnection() {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connection successful!");
    mongoose.connection.close();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
}

testConnection();

