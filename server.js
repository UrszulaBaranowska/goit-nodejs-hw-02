const express = require("express");
const path = require("path");
const app = require("./app");
const connectDB = require("./config/db");
console.log("Starting server...");

const PORT = process.env.PORT || 3000;

console.log(
  "Serving static files from:",
  path.join(__dirname, "public/avatars")
);

app.use((req, res, next) => {
  console.log("Incoming request:", req.url);
  next();
});

app.use("/avatars", express.static(path.join(__dirname, "public/avatars")));

(async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running. Use our API on port: ${PORT}`);
    });
  } catch (err) {
    console.error("Error starting the server:", err.message);
    process.exit(1);
  }
})();
