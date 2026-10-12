const express = require("express");

const {
    createTemplate,
    getTemplates,
    getTemplate,
    updateTemplate,
    deleteTemplate
} = require("../controllers/templateController");

const authMiddleware =
    require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// AUTHENTICATION
// ==========================================

router.use(authMiddleware);


// ==========================================
// TEMPLATE ROUTES
// ==========================================

router.post("/", createTemplate);

router.get("/", getTemplates);

router.get("/:id", getTemplate);

router.put("/:id", updateTemplate);

router.delete("/:id", deleteTemplate);


// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;