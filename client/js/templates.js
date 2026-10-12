"use strict";

const TEMPLATE_STORAGE_KEY = "emailMarketingTemplates";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("templateForm");
    const nameInput = document.getElementById("templateName");
    const subjectInput = document.getElementById("templateSubject");
    const contentInput = document.getElementById("templateContent");
    const list = document.getElementById("templatesList");
    const message = document.getElementById("message");
    const formTitle = document.getElementById("formTitle");
    const saveButton = document.getElementById("saveTemplateButton");
    const cancelButton = document.getElementById("cancelEditButton");
    const logoutButton = document.getElementById("logoutButton");

    let editingId = null;

    // =========================================================
    // STORAGE
    // =========================================================

    function getTemplates() {
        try {
            const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);

            if (!stored) {
                return [];
            }

            const parsed = JSON.parse(stored);

            if (!Array.isArray(parsed)) {
                console.warn("Template storage is not an array.");
                return [];
            }

            return parsed.filter(template => {
                return template && typeof template === "object";
            });
        } catch (error) {
            console.error("Error reading templates:", error);
            return [];
        }
    }

    function saveTemplates(templates) {
        try {
            localStorage.setItem(
                TEMPLATE_STORAGE_KEY,
                JSON.stringify(templates)
            );

            // Notify other pages/tabs that templates changed.
            window.dispatchEvent(
                new StorageEvent("storage", {
                    key: TEMPLATE_STORAGE_KEY,
                    newValue: JSON.stringify(templates)
                })
            );

            return true;
        } catch (error) {
            console.error("Error saving templates:", error);
            showMessage("Could not save template.", "error");
            return false;
        }
    }

    // =========================================================
    // HELPERS
    // =========================================================

    function createId() {
        return (
            Date.now().toString(36) +
            Math.random().toString(36).substring(2, 11)
        );
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function showMessage(text, type = "success") {
        if (!message) {
            return;
        }

        message.textContent = text;
        message.className = `form-message ${type}`;

        setTimeout(() => {
            message.textContent = "";
            message.className = "form-message";
        }, 3000);
    }

    // =========================================================
    // RENDER TEMPLATES
    // =========================================================

    function renderTemplates() {
        if (!list) {
            return;
        }

        const templates = getTemplates();

        if (templates.length === 0) {
            list.innerHTML = `
                <div class="empty-templates">
                    No templates saved yet.
                </div>
            `;
            return;
        }

        list.innerHTML = templates
            .map(template => {
                const preview = String(template.content ?? "")
                    .replace(/\s+/g, " ")
                    .trim();

                return `
                    <article class="template-card">
                        <h3>
                            ${escapeHTML(template.name || "Untitled Template")}
                        </h3>

                        <p class="template-subject">
                            <strong>Subject:</strong>
                            ${escapeHTML(template.subject || "")}
                        </p>

                        <p class="template-preview">
                            ${escapeHTML(preview)}
                        </p>

                        <div class="template-card-actions">

                            <button
                                type="button"
                                class="template-edit-button"
                                data-action="edit"
                                data-id="${escapeHTML(template.id)}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="template-delete-button"
                                data-action="delete"
                                data-id="${escapeHTML(template.id)}"
                            >
                                Delete
                            </button>

                        </div>
                    </article>
                `;
            })
            .join("");
    }

    // =========================================================
    // RESET FORM
    // =========================================================

    function resetForm() {
        editingId = null;

        if (form) {
            form.reset();
        }

        if (formTitle) {
            formTitle.textContent = "Create Email Template";
        }

        if (saveButton) {
            saveButton.textContent = "Save Template";
        }

        if (cancelButton) {
            cancelButton.style.display = "none";
        }
    }

    // =========================================================
    // EDIT
    // =========================================================

    function editTemplate(id) {
        const templates = getTemplates();

        const template = templates.find(
            item => String(item.id) === String(id)
        );

        if (!template) {
            showMessage("Template not found.", "error");
            return;
        }

        editingId = template.id;

        if (nameInput) {
            nameInput.value = template.name || "";
        }

        if (subjectInput) {
            subjectInput.value = template.subject || "";
        }

        if (contentInput) {
            contentInput.value = template.content || "";
        }

        if (formTitle) {
            formTitle.textContent = "Edit Email Template";
        }

        if (saveButton) {
            saveButton.textContent = "Update Template";
        }

        if (cancelButton) {
            cancelButton.style.display = "inline-block";
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    // =========================================================
    // DELETE
    // =========================================================

    function deleteTemplate(id) {
        const templates = getTemplates();

        const template = templates.find(
            item => String(item.id) === String(id)
        );

        if (!template) {
            showMessage("Template not found.", "error");
            return;
        }

        const confirmed = window.confirm(
            `Delete "${template.name || "this template"}"?`
        );

        if (!confirmed) {
            return;
        }

        const updatedTemplates = templates.filter(
            item => String(item.id) !== String(id)
        );

        if (!saveTemplates(updatedTemplates)) {
            return;
        }

        if (String(editingId) === String(id)) {
            resetForm();
        }

        renderTemplates();

        showMessage(
            "Template deleted successfully.",
            "success"
        );
    }

    // =========================================================
    // FORM SUBMIT
    // =========================================================

    if (form) {
        form.addEventListener("submit", event => {
            event.preventDefault();

            const name = nameInput
                ? nameInput.value.trim()
                : "";

            const subject = subjectInput
                ? subjectInput.value.trim()
                : "";

            const content = contentInput
                ? contentInput.value.trim()
                : "";

            if (!name || !subject || !content) {
                showMessage(
                    "Please fill in all template fields.",
                    "error"
                );
                return;
            }

            const templates = getTemplates();

            // -------------------------------------------------
            // UPDATE EXISTING TEMPLATE
            // -------------------------------------------------

            if (editingId !== null) {
                const index = templates.findIndex(
                    item =>
                        String(item.id) ===
                        String(editingId)
                );

                if (index === -1) {
                    showMessage(
                        "Template could not be found.",
                        "error"
                    );
                    return;
                }

                templates[index] = {
                    ...templates[index],
                    id: templates[index].id,
                    name,
                    subject,
                    content,
                    updatedAt: new Date().toISOString()
                };

                if (!saveTemplates(templates)) {
                    return;
                }

                showMessage(
                    "Template updated successfully.",
                    "success"
                );
            }

            // -------------------------------------------------
            // CREATE NEW TEMPLATE
            // -------------------------------------------------

            else {
                const newTemplate = {
                    id: createId(),
                    name,
                    subject,
                    content,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                templates.unshift(newTemplate);

                if (!saveTemplates(templates)) {
                    return;
                }

                showMessage(
                    "Template saved successfully.",
                    "success"
                );
            }

            resetForm();
            renderTemplates();
        });
    }

    // =========================================================
    // CANCEL EDIT
    // =========================================================

    if (cancelButton) {
        cancelButton.addEventListener("click", () => {
            resetForm();
        });
    }

    // =========================================================
    // TEMPLATE CARD ACTIONS
    // =========================================================

    if (list) {
        list.addEventListener("click", event => {
            const button = event.target.closest("button");

            if (!button) {
                return;
            }

            const id = button.dataset.id;
            const action = button.dataset.action;

            if (!id) {
                return;
            }

            if (action === "edit") {
                editTemplate(id);
            }

            if (action === "delete") {
                deleteTemplate(id);
            }
        });
    }

    // =========================================================
    // LOGOUT
    // =========================================================

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "login.html";
        });
    }

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    renderTemplates();
});