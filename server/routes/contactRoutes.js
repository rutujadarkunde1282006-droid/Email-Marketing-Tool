const express = require("express");

const {
  addContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
  unsubscribeContact,
  unsubscribePublic,
  importContacts
} = require("../controllers/contactController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// PUBLIC UNSUBSCRIBE
// ==========================================

router.put(
  "/:id/unsubscribe-public",
  unsubscribePublic
);


// ==========================================
// AUTHENTICATION
// ==========================================

router.use(authMiddleware);


// ==========================================
// CONTACT ROUTES
// ==========================================

// Add contact
router.post(
  "/",
  addContact
);


// Import contacts from CSV data
router.post(
  "/import",
  importContacts
);


// Get all contacts
router.get(
  "/",
  getContacts
);


// Get single contact
router.get(
  "/:id",
  getContact
);


// Update contact
router.put(
  "/:id",
  updateContact
);


// Unsubscribe contact
router.put(
  "/:id/unsubscribe",
  unsubscribeContact
);


// Delete contact
router.delete(
  "/:id",
  deleteContact
);


module.exports = router;