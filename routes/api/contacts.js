const express = require("express");
const {
  listContacts,
  getContactById,
  addContact,
  removeContact,
  updateContact
} = require("../../models/contacts");

const router = express.Router();
const Joi = require("joi");

const contactSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\(\d{3}\) \d{3}-\d{4}$/)
    .required()
});

const contactPatchSchema = Joi.object({
  name: Joi.string().min(3).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^\(\d{3}\) \d{3}-\d{4}$/)
    .optional()
}).min(1);

router.get("/", async (req, res, next) => {
  try {
    console.log("GET /api/contacts endpoint called");
    const contacts = await listContacts();
    console.log("Contacts retrieved:", contacts);
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error in GET /api/contacts:", error);
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/contacts/${id} endpoint called`);
    const contact = await getContactById(id);
    if (!contact) {
      console.log("Contact not found");
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json(contact);
  } catch (error) {
    console.error(`Error in GET /api/contacts/${req.params.id}:`, error);
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { error } = contactSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const newContact = await addContact(req.body);
    res.status(201).json(newContact);
  } catch (err) {
    console.error("Error in POST /contacts:", err);
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { error } = contactSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updatedContact = await updateContact(req.params.id, req.body);
    if (!updatedContact) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json(updatedContact);
  } catch (err) {
    console.error("Error in PUT /contacts/:id:", err);
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const removedContact = await removeContact(req.params.id);
    if (!removedContact) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json({ message: "contact deleted" });
  } catch (err) {
    console.error("Error in DELETE /contacts/:id:", err);
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { error } = contactPatchSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updatedContact = await updateContact(req.params.id, req.body);
    if (!updatedContact) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json(updatedContact);
  } catch (err) {
    console.error("Error in PATCH /contacts/:id:", err);
    next(err);
  }
});

module.exports = router;
