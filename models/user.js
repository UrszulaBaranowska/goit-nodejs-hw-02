const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    subscription: {
      type: String,
      enum: ["starter", "pro", "business"],
      default: "starter"
    },
    token: {
      type: String,
      default: null
    },
    avatarURL: {
      type: String,
      required: true
    }
  },
  { versionKey: false, timestamps: true }
);

const User = model("user", userSchema);

module.exports = User;
