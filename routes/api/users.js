const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const gravatar = require("gravatar");
const User = require("../../models/user");
const Contact = require("../../models/contact");
const authMiddleware = require("../../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const jimp = require("jimp");
const { v4: uuidv4 } = require("uuid");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const router = express.Router();

const tmpDir = path.join(__dirname, "../../tmp");
const upload = multer({ dest: tmpDir });

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

router.post("/signup", async (req, res, next) => {
  console.log("Signup request received");
  try {
    console.log(
      "SENDGRID_API_KEY:",
      process.env.SENDGRID_API_KEY ? "Loaded" : "Missing"
    );
    console.log("SENDGRID_SENDER:", process.env.SENDGRID_SENDER || "Missing");
    // Walidacja danych wejściowych
    const { error } = signupSchema.validate(req.body);
    if (error) {
      console.error("Validation error:", error.details[0].message);
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed");

    const avatarURL = gravatar.url(email, { s: "250", d: "retro" }, true);
    console.log("Gravatar generated:", avatarURL);

    const verificationToken = uuidv4();
    console.log("Verification token generated:", verificationToken);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      avatarURL,
      verificationToken
    });
    console.log("User created in database:", newUser);

    const verificationLink = `${req.protocol}://${req.get(
      "host"
    )}/users/verify/${verificationToken}`;
    console.log("Verification link:", verificationLink);

    const msg = {
      to: email,
      from: process.env.SENDGRID_SENDER,
      subject: "Email Verification",
      html: `<p>Click the link to verify your email: <a href="${verificationLink}">${verificationLink}</a></p>`
    };

    try {
      await sgMail.send(msg);
      console.log("Verification email sent to:", email);
    } catch (emailError) {
      console.error("Error sending email:", emailError.message);
      return res.status(500).json({ message: "Email sending failed" });
    }

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL
      }
    });
  } catch (error) {
    console.error("Error in signup endpoint:", error.message, error.stack);
    next(error);
  }
});

router.get("/verify/:verificationToken", async (req, res, next) => {
  try {
    const { verificationToken } = req.params;

    const user = await User.findOne({ verificationToken });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.verificationToken = null;
    user.verify = true;
    await user.save();

    res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    next(error);
  }
});

router.post("/verify", async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Missing required field email" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verify) {
      return res.status(400).json({
        message: "Verification has already been passed"
      });
    }

    const verificationLink = `${req.protocol}://${req.get(
      "host"
    )}/users/verify/${user.verificationToken}`;

    const msg = {
      to: email,
      from: process.env.SENDGRID_SENDER,
      subject: "Email Verification",
      html: `<p>Click the link to verify your email: <a href="${verificationLink}">${verificationLink}</a></p>`
    };

    await sgMail.send(msg);

    res.status(200).json({ message: "Verification email sent" });
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

router.delete("/delete", authMiddleware, async (req, res, next) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user._id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await Contact.deleteMany({ owner: req.user._id });

    const avatarPath = path.join(
      __dirname,
      "../../public",
      deletedUser.avatarURL
    );
    try {
      await fs.unlink(avatarPath);
    } catch (err) {
      console.warn("Avatar file not found or already deleted:", avatarPath);
    }

    res
      .status(200)
      .json({ message: "User and related contacts deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
