const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authMiddleware = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    console.log("AuthMiddleware triggered for:", req.url);

    if (!authorization || !authorization.startsWith("Bearer ")) {
      console.error("Authorization header missing or invalid");
      return res.status(401).json({ message: "Not authorized" });
    }

    const token = authorization.split(" ")[1];
    console.log("Token received:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token ID:", decoded.id);

    const user = await User.findById(decoded.id);
    if (!user || user.token !== token) {
      console.error("User not found or token mismatch");
      return res.status(401).json({ message: "Not authorized" });
    }

    console.log("User authenticated:", user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    res.status(401).json({ message: "Not authorized" });
  }
};

module.exports = authMiddleware;
