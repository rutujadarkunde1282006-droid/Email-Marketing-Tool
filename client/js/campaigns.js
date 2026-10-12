"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    // ==========================================
    // AUTH CHECK
    // ==========================================

    if (!token || !user) {
        window.location.href = "login.html";
        return;
    }

    // ==========================================
    // ELEMENTS
    // ==========================================

    const campaignForm = document.getElementById("campaignForm");
    const campaignNameInput = document.getElementById("campaignName");
    const templateSelect = document.getElementById("templateSelect");
    const subjectInput = document.getElementById("subject");
    const contentInput = document.getElementById("content");

    const selectAllCheckbox = document.getElementById("selectAll");
    const contactsList = document.getElementById("contactsList");
    const selectedCountElement = document.getElementById("selectedCount");

    const saveCampaignButton =
        document.getElementById("saveCampaignButton");

    const previewCampaignButton =
        document.getElementById("previewCampaignButton");

    const messageElement =
        document.getElementById("message");

    const campaignPreview =
        document.getElementById("campaignPreview");

    const previewSubject =
        document.getElementById("previewSubject");

    const previewContent =
        document.getElementById("previewContent");

    const campaignsList =
        document.getElementById("campaignsList");

    const totalCampaignsElement =
        document.getElementById("totalCampaigns");

    const sentCampaignsElement =
        document.getElementById("sentCampaigns");

    const draftCampaignsElement =
        document.getElementById("draftCampaigns");

    const failedCampaignsElement =
        document.getElementById("failedCampaigns");

    const logoutButton =
        document.getElementById("logoutButton");

    // ==========================================
    // STATE
    // ==========================================

    let contacts = [];
    let campaigns = [];
    let templates = [];
    let isSending = false;

    // ==========================================
    // API HELPER
    // ==========================================

    async function apiRequest(url, options = {}) {
        const requestOptions = {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        };

        const response = await fetch(url, requestOptions);

        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "login.html";
            return null;
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                `Request failed with status ${response.status}`
            );
        }

        return data;
    }

    // ==========================================
    // MESSAGE
    // ==========================================

    function showMessage(text, type = "success") {
        if (!messageElement) return;

        messageElement.textContent = text;
        messageElement.className = `message ${type}`;

        messageElement.style.display = "block";

        clearTimeout(showMessage.timeout);

        showMessage.timeout = setTimeout(() => {
            messageElement.style.display = "none";
        }, 5000);
    }

    // ==========================================
    // TEMPLATE LOADING
    // ==========================================

    function getLocalTemplates() {
        try {
            const stored =
                localStorage.getItem(
                    "emailMarketingTemplates"
                );

            if (!stored) {
                return [];
            }

            const parsed = JSON.parse(stored);

            return Array.isArray(parsed)
                ? parsed
                : [];
        } catch (error) {
            console.error(
                "Error reading templates:",
                error
            );

            return [];
        }
    }

    function loadTemplates() {
        templates = getLocalTemplates();

        if (!templateSelect) return;

        templateSelect.innerHTML =
            `<option value="">Select email template</option>`;

        templates.forEach((template, index) => {
            const option =
                document.createElement("option");

            option.value =
                template.id ||
                template._id ||
                index;

            option.textContent =
                template.name ||
                `Template ${index + 1}`;

            templateSelect.appendChild(option);
        });
    }

    // ==========================================
    // TEMPLATE CHANGE
    // ==========================================

    function handleTemplateChange() {
        if (!templateSelect) return;

        const selectedValue =
            String(templateSelect.value);

        if (!selectedValue) {
            return;
        }

        const template =
            templates.find((item, index) => {
                const id =
                    item.id ||
                    item._id ||
                    index;

                return String(id) === selectedValue;
            });

        if (!template) return;

        if (subjectInput) {
            subjectInput.value =
                template.subject || "";
        }

        if (contentInput) {
            contentInput.value =
                template.content || "";
        }
    }

    // ==========================================
    // LOAD CONTACTS
    // ==========================================

    async function loadContacts() {
        if (!contactsList) return;

        contactsList.innerHTML =
            `<div class="loading">Loading customers...</div>`;

        try {
            const data =
                await apiRequest("/api/contacts");

            if (!data) return;

            contacts =
                Array.isArray(data.contacts)
                    ? data.contacts
                    : [];

            renderContacts();
            updateSelectedCount();

        } catch (error) {
            console.error(
                "Load contacts error:",
                error
            );

            contactsList.innerHTML =
                `<div class="error">
                    Unable to load customers.
                </div>`;

            showMessage(
                error.message ||
                "Unable to load customers.",
                "error"
            );
        }
    }

    // ==========================================
    // RENDER CONTACTS
    // ==========================================

    function renderContacts() {
        if (!contactsList) return;

        contactsList.innerHTML = "";

        if (contacts.length === 0) {
            contactsList.innerHTML =
                `<div class="empty-state">
                    No customers found.
                </div>`;

            return;
        }

        contacts.forEach((contact, index) => {
            const contactId =
                contact._id ||
                contact.id ||
                index;

            const status =
                String(
                    contact.status || "active"
                ).toLowerCase();

            const isActive =
                status === "active";

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "contact-item";

            wrapper.innerHTML = `
                <label class="contact-row">
                    <input
                        type="checkbox"
                        class="contact-checkbox"
                        value="${escapeHtml(String(contactId))}"
                        ${isActive ? "" : "disabled"}
                    >

                    <div class="contact-info">
                        <strong>
                            ${escapeHtml(
                                contact.name ||
                                "Unnamed Customer"
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                contact.email || ""
                            )}
                        </span>
                    </div>

                    <span class="contact-status ${isActive ? "active" : "inactive"}">
                        ${escapeHtml(status)}
                    </span>
                </label>
            `;

            contactsList.appendChild(wrapper);
        });

        bindContactCheckboxes();
    }

    // ==========================================
    // ESCAPE HTML
    // ==========================================

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ==========================================
    // CHECKBOXES
    // ==========================================

    function bindContactCheckboxes() {
        const checkboxes =
            document.querySelectorAll(
                ".contact-checkbox"
            );

        checkboxes.forEach((checkbox) => {
            checkbox.addEventListener(
                "change",
                () => {
                    updateSelectedCount();
                    updateSelectAllState();
                }
            );
        });
    }

    function getSelectedContactIds() {
        const checkboxes =
            document.querySelectorAll(
                ".contact-checkbox:checked"
            );

        return Array.from(checkboxes)
            .map(
                (checkbox) =>
                    checkbox.value
            )
            .filter(Boolean);
    }

    function updateSelectedCount() {
        if (!selectedCountElement) return;

        const selected =
            getSelectedContactIds();

        selectedCountElement.textContent =
            selected.length;
    }

    function updateSelectAllState() {
        if (!selectAllCheckbox) return;

        const checkboxes =
            Array.from(
                document.querySelectorAll(
                    ".contact-checkbox:not(:disabled)"
                )
            );

        const checked =
            checkboxes.filter(
                (checkbox) =>
                    checkbox.checked
            );

        selectAllCheckbox.checked =
            checkboxes.length > 0 &&
            checked.length ===
                checkboxes.length;

        selectAllCheckbox.indeterminate =
            checked.length > 0 &&
            checked.length <
                checkboxes.length;
    }

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener(
            "change",
            () => {
                const checkboxes =
                    document.querySelectorAll(
                        ".contact-checkbox:not(:disabled)"
                    );

                checkboxes.forEach(
                    (checkbox) => {
                        checkbox.checked =
                            selectAllCheckbox.checked;
                    }
                );

                updateSelectedCount();
            }
        );
    }

    // ==========================================
    // PREVIEW
    // ==========================================

    function showPreview() {
        const subject =
            subjectInput
                ? subjectInput.value.trim()
                : "";

        const content =
            contentInput
                ? contentInput.value
                : "";

        if (!subject && !content) {
            showMessage(
                "Please enter a subject or content first.",
                "error"
            );

            return;
        }

        if (previewSubject) {
            previewSubject.textContent =
                subject;
        }

        if (previewContent) {
            previewContent.textContent =
                content;
        }

        if (campaignPreview) {
            campaignPreview.style.display =
                "block";
        }
    }

    if (previewCampaignButton) {
        previewCampaignButton.addEventListener(
            "click",
            showPreview
        );
    }

    // ==========================================
    // CREATE CAMPAIGN
    // ==========================================

    async function createCampaign() {
        if (!campaignForm) return;

        const name =
            campaignNameInput
                ? campaignNameInput.value.trim()
                : "";

        const subject =
            subjectInput
                ? subjectInput.value.trim()
                : "";

        const content =
            contentInput
                ? contentInput.value
                : "";

        const recipients =
            getSelectedContactIds();

        if (!name) {
            showMessage(
                "Please enter a campaign name.",
                "error"
            );

            return;
        }

        if (!subject) {
            showMessage(
                "Please enter an email subject.",
                "error"
            );

            return;
        }

        if (!content.trim()) {
            showMessage(
                "Please enter email content.",
                "error"
            );

            return;
        }

        if (recipients.length === 0) {
            showMessage(
                "Please select at least one customer.",
                "error"
            );

            return;
        }

        if (saveCampaignButton) {
            saveCampaignButton.disabled = true;
            saveCampaignButton.textContent =
                "Saving...";
        }

        try {
            const data =
                await apiRequest(
                    "/api/campaigns",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            name,
                            subject,
                            content,
                            recipients
                        })
                    }
                );

            if (!data) return;

            showMessage(
                data.message ||
                "Campaign created successfully.",
                "success"
            );

            campaignForm.reset();

            if (campaignPreview) {
                campaignPreview.style.display =
                    "none";
            }

            updateSelectedCount();

            await loadCampaigns();

        } catch (error) {
            console.error(
                "Create campaign error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to create campaign.",
                "error"
            );
        } finally {
            if (saveCampaignButton) {
                saveCampaignButton.disabled =
                    false;

                saveCampaignButton.textContent =
                    "Save Campaign";
            }
        }
    }

    if (campaignForm) {
        campaignForm.addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();

                await createCampaign();
            }
        );
    }

    // ==========================================
    // LOAD CAMPAIGNS
    // ==========================================

    async function loadCampaigns() {
        if (!campaignsList) return;

        campaignsList.innerHTML =
            `<div class="loading">
                Loading campaigns...
            </div>`;

        try {
            const data =
                await apiRequest(
                    "/api/campaigns"
                );

            if (!data) return;

            campaigns =
                Array.isArray(data.campaigns)
                    ? data.campaigns
                    : [];

            renderCampaigns();
            updateCampaignStats();

        } catch (error) {
            console.error(
                "Load campaigns error:",
                error
            );

            campaignsList.innerHTML =
                `<div class="error">
                    Unable to load campaigns.
                </div>`;

            showMessage(
                error.message ||
                "Unable to load campaigns.",
                "error"
            );
        }
    }

    // ==========================================
    // RENDER CAMPAIGNS
    // ==========================================

    function renderCampaigns() {
        if (!campaignsList) return;

        campaignsList.innerHTML = "";

        if (campaigns.length === 0) {
            campaignsList.innerHTML =
                `<div class="empty-state">
                    No campaigns created yet.
                </div>`;

            return;
        }

        campaigns.forEach((campaign) => {
            const card =
                document.createElement("div");

            card.className =
                "campaign-card";

            const status =
                String(
                    campaign.status ||
                    "draft"
                ).toLowerCase();

            const total =
                Number(
                    campaign.totalRecipients ||
                    campaign.recipients?.length ||
                    0
                );

            const sent =
                Number(
                    campaign.sentCount || 0
                );

            const failed =
                Number(
                    campaign.failedCount || 0
                );

            const skipped =
                Number(
                    campaign.skippedCount || 0
                );

            const createdDate =
                campaign.createdAt
                    ? new Date(
                          campaign.createdAt
                      ).toLocaleString()
                    : "-";

            card.innerHTML = `
                <div class="campaign-card-header">
                    <div>
                        <h3>
                            ${escapeHtml(
                                campaign.name ||
                                "Untitled Campaign"
                            )}
                        </h3>

                        <p>
                            ${escapeHtml(
                                campaign.subject ||
                                ""
                            )}
                        </p>
                    </div>

                    <span class="campaign-status ${escapeHtml(status)}">
                        ${escapeHtml(status)}
                    </span>
                </div>

                <div class="campaign-details">
                    <div>
                        <span>Recipients</span>
                        <strong>${total}</strong>
                    </div>

                    <div>
                        <span>Sent</span>
                        <strong>${sent}</strong>
                    </div>

                    <div>
                        <span>Failed</span>
                        <strong>${failed}</strong>
                    </div>

                    <div>
                        <span>Skipped</span>
                        <strong>${skipped}</strong>
                    </div>
                </div>

                <div class="campaign-date">
                    Created: ${escapeHtml(createdDate)}
                </div>

                <div class="campaign-actions">
                    ${
                        status === "draft" ||
                        status === "failed"
                            ? `
                            <button
                                type="button"
                                class="send-campaign-button"
                                data-id="${escapeHtml(
                                    String(campaign._id)
                                )}"
                            >
                                Send
                            </button>
                            `
                            : ""
                    }

                    ${
                        status !== "sending"
                            ? `
                            <button
                                type="button"
                                class="delete-campaign-button"
                                data-id="${escapeHtml(
                                    String(campaign._id)
                                )}"
                            >
                                Delete
                            </button>
                            `
                            : ""
                    }
                </div>
            `;

            campaignsList.appendChild(card);
        });

        bindCampaignActions();
    }

    // ==========================================
    // CAMPAIGN STATS
    // ==========================================

    function updateCampaignStats() {
        const total =
            campaigns.length;

        const sent =
            campaigns.filter(
                (campaign) =>
                    campaign.status ===
                    "sent"
            ).length;

        const draft =
            campaigns.filter(
                (campaign) =>
                    campaign.status ===
                    "draft"
            ).length;

        const failed =
            campaigns.filter(
                (campaign) =>
                    campaign.status ===
                    "failed"
            ).length;

        if (totalCampaignsElement) {
            totalCampaignsElement.textContent =
                total;
        }

        if (sentCampaignsElement) {
            sentCampaignsElement.textContent =
                sent;
        }

        if (draftCampaignsElement) {
            draftCampaignsElement.textContent =
                draft;
        }

        if (failedCampaignsElement) {
            failedCampaignsElement.textContent =
                failed;
        }
    }

    // ==========================================
    // SEND CAMPAIGN
    // ==========================================

    async function sendCampaign(campaignId) {
        if (!campaignId) {
            showMessage(
                "Invalid campaign ID.",
                "error"
            );

            return;
        }

        if (isSending) {
            return;
        }

        const campaign =
            campaigns.find(
                (item) =>
                    String(item._id) ===
                    String(campaignId)
            );

        if (!campaign) {
            showMessage(
                "Campaign not found.",
                "error"
            );

            return;
        }

        if (campaign.status === "sent") {
            showMessage(
                "This campaign has already been sent.",
                "error"
            );

            return;
        }

        const confirmed =
            window.confirm(
                `Send "${campaign.name}" to ${campaign.totalRecipients || campaign.recipients?.length || 0} customer(s)?`
            );

        if (!confirmed) {
            return;
        }

        isSending = true;

        const button =
            document.querySelector(
                `.send-campaign-button[data-id="${CSS.escape(
                    String(campaignId)
                )}"]`
            );

        if (button) {
            button.disabled = true;
            button.textContent =
                "Sending...";
        }

        showMessage(
            "Sending campaign. Please wait...",
            "success"
        );

        try {
            /*
             * IMPORTANT:
             *
             * This is the real email sending request.
             *
             * Backend route:
             * POST /api/campaigns/:id/send
             *
             * The backend gets the selected customers
             * from MongoDB and uses Nodemailer/SMTP.
             */
            const data =
                await apiRequest(
                    `/api/campaigns/${encodeURIComponent(
                        campaignId
                    )}/send`,
                    {
                        method: "POST",
                        body: JSON.stringify({})
                    }
                );

            if (!data) return;

            if (data.success) {
                showMessage(
                    data.message ||
                    "Campaign sent successfully.",
                    "success"
                );

                await loadCampaigns();
            } else {
                showMessage(
                    data.message ||
                    "Campaign could not be sent.",
                    "error"
                );

                await loadCampaigns();
            }

        } catch (error) {
            console.error(
                "Send campaign error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to send campaign.",
                "error"
            );

            /*
             * Reload from MongoDB so the UI shows
             * the actual backend status instead of
             * pretending that the campaign was sent.
             */
            await loadCampaigns();

        } finally {
            isSending = false;
        }
    }

    // ==========================================
    // DELETE CAMPAIGN
    // ==========================================

    async function deleteCampaign(
        campaignId
    ) {
        if (!campaignId) return;

        const campaign =
            campaigns.find(
                (item) =>
                    String(item._id) ===
                    String(campaignId)
            );

        if (!campaign) return;

        const confirmed =
            window.confirm(
                `Delete "${campaign.name}"?`
            );

        if (!confirmed) return;

        try {
            const data =
                await apiRequest(
                    `/api/campaigns/${encodeURIComponent(
                        campaignId
                    )}`,
                    {
                        method: "DELETE"
                    }
                );

            if (!data) return;

            showMessage(
                data.message ||
                "Campaign deleted successfully.",
                "success"
            );

            await loadCampaigns();

        } catch (error) {
            console.error(
                "Delete campaign error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to delete campaign.",
                "error"
            );
        }
    }

    // ==========================================
    // BIND CAMPAIGN ACTIONS
    // ==========================================

    function bindCampaignActions() {
        const sendButtons =
            document.querySelectorAll(
                ".send-campaign-button"
            );

        sendButtons.forEach((button) => {
            button.addEventListener(
                "click",
                async () => {
                    await sendCampaign(
                        button.dataset.id
                    );
                }
            );
        });

        const deleteButtons =
            document.querySelectorAll(
                ".delete-campaign-button"
            );

        deleteButtons.forEach((button) => {
            button.addEventListener(
                "click",
                async () => {
                    await deleteCampaign(
                        button.dataset.id
                    );
                }
            );
        });
    }

    // ==========================================
    // LOGOUT
    // ==========================================

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            () => {
                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );

                window.location.href =
                    "login.html";
            }
        );
    }

    // ==========================================
    // TEMPLATE EVENT
    // ==========================================

    if (templateSelect) {
        templateSelect.addEventListener(
            "change",
            handleTemplateChange
        );
    }

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    async function initialize() {
        loadTemplates();

        await loadContacts();

        await loadCampaigns();
    }

    initialize();
});