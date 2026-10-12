const Template = require("../models/Template");

// ==========================================
// CREATE TEMPLATE
// ==========================================

const createTemplate = async (req, res) => {
    try {
        const { name, subject, content } = req.body;

        if (!name || !subject || !content) {
            return res.status(400).json({
                success: false,
                message: "Name, subject and content are required"
            });
        }

        const template = await Template.create({
            userId: req.userId,
            name: name.trim(),
            subject: subject.trim(),
            content: content.trim()
        });

        res.status(201).json({
            success: true,
            message: "Template created successfully",
            template
        });

    } catch (error) {
        console.error("Create template error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while creating template"
        });
    }
};


// ==========================================
// GET ALL TEMPLATES
// ==========================================

const getTemplates = async (req, res) => {
    try {
        const templates = await Template.find({
            userId: req.userId
        }).sort({
            createdAt: -1
        });

        res.json({
            success: true,
            count: templates.length,
            templates
        });

    } catch (error) {
        console.error("Get templates error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while getting templates"
        });
    }
};


// ==========================================
// GET SINGLE TEMPLATE
// ==========================================

const getTemplate = async (req, res) => {
    try {
        const template = await Template.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found"
            });
        }

        res.json({
            success: true,
            template
        });

    } catch (error) {
        console.error("Get template error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while getting template"
        });
    }
};


// ==========================================
// UPDATE TEMPLATE
// ==========================================

const updateTemplate = async (req, res) => {
    try {
        const { name, subject, content } = req.body;

        if (!name || !subject || !content) {
            return res.status(400).json({
                success: false,
                message: "Name, subject and content are required"
            });
        }

        const template = await Template.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.userId
            },
            {
                name: name.trim(),
                subject: subject.trim(),
                content: content.trim()
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found"
            });
        }

        res.json({
            success: true,
            message: "Template updated successfully",
            template
        });

    } catch (error) {
        console.error("Update template error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating template"
        });
    }
};


// ==========================================
// DELETE TEMPLATE
// ==========================================

const deleteTemplate = async (req, res) => {
    try {
        const template = await Template.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found"
            });
        }

        res.json({
            success: true,
            message: "Template deleted successfully"
        });

    } catch (error) {
        console.error("Delete template error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while deleting template"
        });
    }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    createTemplate,
    getTemplates,
    getTemplate,
    updateTemplate,
    deleteTemplate
};