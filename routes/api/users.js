const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const gravatar = require("gravatar");
const User = require("../../models/user");
const authMiddleware = require("../../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const jimp = require("jimp");
console.log("Jimp export:", jimp);

const router = express.Router();

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const tmpDir = path.join(__dirname, "../../tmp");
const upload = multer({ dest: tmpDir });

router.post("/signup", async (req, res, next) => {
  try {
    const { error } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const avatarURL = gravatar.url(email, { s: "250", d: "retro" }, true);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      avatarURL
    });

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    user.token = token;
    await user.save();

    res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/logout", authMiddleware, async (req, res, next) => {
  try {
    const user = req.user;

    user.token = null;
    await user.save();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/current", authMiddleware, (req, res, next) => {
  const { email, subscription, avatarURL } = req.user;
  res.status(200).json({ email, subscription, avatarURL });
});

router.patch(
  "/avatars",
  authMiddleware,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { path: tempPath, originalname } = req.file;
      const fileExtension = originalname.split(".").pop();
      const uniqueName = `${req.user._id}.${fileExtension}`;
      const uploadPath = path.join(
        __dirname,
        "../../public/avatars",
        uniqueName
      );

      try {
        const image = await jimp.read(tempPath);
        await image.resize(250, 250).writeAsync(uploadPath);
      } catch (err) {
        console.error("Error processing image with Jimp:", err.message);
        throw new Error("Image processing failed");
      }

      await fs.unlink(tempPath);

      req.user.avatarURL = `/avatars/${uniqueName}`;
      await req.user.save();

      res.status(200).json({ avatarURL: req.user.avatarURL });
    } catch (error) {
      console.error("Error in PATCH /users/avatars:", error.message);
      next(error);
    }
  }
);

module.exports = router;
