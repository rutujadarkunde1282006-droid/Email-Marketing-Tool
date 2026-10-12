const Contact = require("../models/Contact");


// ==========================================
// ADD CONTACT
// ==========================================

const addContact = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required"
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    const existingContact = await Contact.findOne({
      userId: req.userId,
      email: cleanEmail
    });

    if (existingContact) {
      return res.status(409).json({
        success: false,
        message: "This email already exists in your contacts"
      });
    }

    const contact = await Contact.create({
      userId: req.userId,
      name: cleanName,
      email: cleanEmail,
      status: "active"
    });

    res.status(201).json({
      success: true,
      message: "Contact added successfully",
      contact
    });

  } catch (error) {
    console.error("Add contact error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while adding contact"
    });
  }
};


// ==========================================
// GET CONTACTS
// ==========================================

const getContacts = async (req, res) => {
  try {
    const search = req.query.search || "";

    const filter = {
      userId: req.userId
    };

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i"
          }
        },
        {
          email: {
            $regex: search,
            $options: "i"
          }
        }
      ];
    }

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: contacts.length,
      contacts
    });

  } catch (error) {
    console.error("Get contacts error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while getting contacts"
    });
  }
};


// ==========================================
// GET SINGLE CONTACT
// ==========================================

const getContact = async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    res.json({
      success: true,
      contact
    });

  } catch (error) {
    console.error("Get contact error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// ==========================================
// UPDATE CONTACT
// ==========================================

const updateContact = async (req, res) => {
  try {
    const { name, email, status } = req.body;

    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    if (name !== undefined) {
      const cleanName = name.trim();

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty"
        });
      }

      contact.name = cleanName;
    }

    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty"
        });
      }

      const duplicate = await Contact.findOne({
        userId: req.userId,
        email: cleanEmail,
        _id: { $ne: req.params.id }
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "This email already exists in your contacts"
        });
      }

      contact.email = cleanEmail;
    }

    if (status !== undefined) {
      contact.status = status;
    }

    await contact.save();

    res.json({
      success: true,
      message: "Contact updated successfully",
      contact
    });

  } catch (error) {
    console.error("Update contact error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating contact"
    });
  }
};


// ==========================================
// DELETE CONTACT
// ==========================================

const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    res.json({
      success: true,
      message: "Contact deleted successfully"
    });

  } catch (error) {
    console.error("Delete contact error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting contact"
    });
  }
};


// ==========================================
// UNSUBSCRIBE CONTACT
// ==========================================

const unsubscribeContact = async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    contact.status = "unsubscribed";

    await contact.save();

    res.json({
      success: true,
      message: "Customer unsubscribed successfully"
    });

  } catch (error) {
    console.error("Unsubscribe error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// ==========================================
// PUBLIC UNSUBSCRIBE
// ==========================================

const unsubscribePublic = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    contact.status = "unsubscribed";

    await contact.save();

    res.json({
      success: true,
      message: "You have been unsubscribed successfully."
    });

  } catch (error) {
    console.error("Public unsubscribe error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while unsubscribing"
    });
  }
};


// ==========================================
// IMPORT CONTACTS
// ==========================================

const importContacts = async (req, res) => {
  try {

    const { contacts } = req.body;

    // --------------------------------------
    // VALIDATE IMPORT DATA
    // --------------------------------------

    if (
      !Array.isArray(contacts) ||
      contacts.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No contacts found in import file"
      });
    }


    let importedCount = 0;
    let skippedCount = 0;


    // --------------------------------------
    // PROCESS CONTACTS
    // --------------------------------------

    for (const item of contacts) {

      const name = String(
        item.name || ""
      ).trim();

      const email = String(
        item.email || ""
      ).trim().toLowerCase();


      // Skip invalid rows

      if (!name || !email) {
        skippedCount++;
        continue;
      }


      // ------------------------------------
      // CHECK DUPLICATE
      // ------------------------------------

      const existingContact =
        await Contact.findOne({
          userId: req.userId,
          email: email
        });


      if (existingContact) {
        skippedCount++;
        continue;
      }


      // ------------------------------------
      // CREATE CONTACT
      // ------------------------------------

      await Contact.create({
        userId: req.userId,
        name: name,
        email: email,
        status: "active"
      });


      importedCount++;
    }


    // --------------------------------------
    // SEND RESPONSE
    // --------------------------------------

    res.status(201).json({
      success: true,
      message: "Contacts imported successfully",
      importedCount,
      skippedCount
    });

  } catch (error) {

    console.error(
      "Import contacts error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error while importing contacts"
    });
  }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  addContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
  unsubscribeContact,
  unsubscribePublic,
  importContacts
};