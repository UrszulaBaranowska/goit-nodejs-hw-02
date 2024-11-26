const express = require("express");
const Contact = require("../../models/contact");
const authMiddleware = require("../../middlewares/authMiddleware");
const Joi = require("joi");

const router = express.Router();

const contactSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\(\d{3}\) \d{3}-\d{4}$/)
    .required(),
  favorite: Joi.boolean()
});

const contactPatchSchema = Joi.object({
  name: Joi.string().min(3).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^\(\d{3}\) \d{3}-\d{4}$/)
    .optional(),
  favorite: Joi.boolean().optional()
}).min(1);

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, favorite } = req.query;
    const skip = (page - 1) * limit;
    const filter = { owner: req.user._id };
    if (favorite !== undefined) {
      filter.favorite = favorite === "true";
    }

    const contacts = await Contact.find(filter).skip(skip).limit(Number(limit));
    res.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findOne({ _id: id, owner: req.user._id });
    if (!contact) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json(contact);
  } catch (error) {
    next(error);
  }
});

router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { error } = contactSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const newContact = await Contact.create({
      ...req.body,
      owner: req.user._id
    });
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authMiddleware, async (req, res, next) => {
  try {
    const { error } = contactSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updatedContact = await Contact.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    );

    if (!updatedContact) {
      return res.status(404).json({ message: "Not found" });
    }

    res.status(200).json(updatedContact);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", authMiddleware, async (req, res, next) => {
  try {
    const { error } = contactPatchSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updatedContact = await Contact.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    );

    if (!updatedContact) {
      return res.status(404).json({ message: "Not found" });
    }

    res.status(200).json(updatedContact);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const removedContact = await Contact.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!removedContact) {
      return res.status(404).json({ message: "Not found" });
    }

    res.status(200).json({ message: "Contact deleted" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
