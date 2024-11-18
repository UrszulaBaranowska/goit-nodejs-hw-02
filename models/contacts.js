const fs = require("fs/promises");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const contactsPath = path.join(__dirname, "./contacts.json");

const listContacts = async () => {
  try {
    console.log("Reading contacts from:", contactsPath);
    const data = await fs.readFile(contactsPath, "utf8");
    console.log("Data read from file:", data);
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading contacts.json:", err);
    throw err;
  }
};

const getContactById = async (contactId) => {
  try {
    console.log("Searching for contact with ID:", contactId);
    const contacts = await listContacts();
    const contact = contacts.find((contact) => contact.id === contactId);
    console.log("Contact found:", contact);
    return contact || null;
  } catch (err) {
    console.error("Error in getContactById:", err);
    throw err;
  }
};

const addContact = async ({ name, email, phone }) => {
  const contacts = await listContacts();
  const newContact = { id: uuidv4(), name, email, phone };
  contacts.push(newContact);
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
  return newContact;
};

const removeContact = async (contactId) => {
  const contacts = await listContacts();
  const index = contacts.findIndex((contact) => contact.id === contactId);
  if (index === -1) return null;
  const [removedContact] = contacts.splice(index, 1);
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
  return removedContact;
};

const updateContact = async (contactId, updates) => {
  const contacts = await listContacts();
  const index = contacts.findIndex((contact) => contact.id === contactId);
  if (index === -1) return null;

  contacts[index] = Object.assign(contacts[index], updates);
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
  return contacts[index];
};

module.exports = {
  listContacts,
  getContactById,
  addContact,
  removeContact,
  updateContact
};
