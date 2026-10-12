"use strict";

/*
 * ============================================================
 * CONTACTS / CUSTOMERS PAGE
 * ============================================================
 *
 * Backend endpoints used:
 *
 * GET    /api/contacts
 * POST   /api/contacts
 * POST   /api/contacts/import
 * GET    /api/contacts/:id
 * PUT    /api/contacts/:id
 * PUT    /api/contacts/:id/unsubscribe
 * DELETE /api/contacts/:id
 *
 * Contacts are stored in MongoDB through contactController.js.
 * ============================================================
 */


document.addEventListener("DOMContentLoaded", () => {

    // ========================================================
    // AUTHENTICATION
    // ========================================================

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
        window.location.href = "/login.html";
        return;
    }


    // ========================================================
    // DOM ELEMENTS
    // ========================================================

    const contactForm =
        document.getElementById("contactForm");

    const nameInput =
        document.getElementById("name");

    const emailInput =
        document.getElementById("email");

    const addContactButton =
        document.getElementById("addContactButton");

    const importForm =
        document.getElementById("importForm");

    const csvFile =
        document.getElementById("csvFile");

    const importButton =
        document.getElementById("importButton");

    const contactsTable =
        document.getElementById("contactsTable") ||
        document.getElementById("contactsList");

    const searchInput =
        document.getElementById("search") ||
        document.getElementById("searchContacts") ||
        document.getElementById("contactSearch");

    const messageBox =
        document.getElementById("message");

    const logoutButton =
        document.getElementById("logoutButton");


    // ========================================================
    // LOCAL PAGE STATE
    // ========================================================

    let allContacts = [];

    let messageTimer = null;


    // ========================================================
    // AUTH HEADERS
    // ========================================================

    function getHeaders(includeJSON = false) {

        const headers = {
            Authorization: `Bearer ${token}`
        };

        if (includeJSON) {
            headers["Content-Type"] = "application/json";
        }

        return headers;
    }


    // ========================================================
    // SHOW MESSAGE
    // ========================================================

    function showMessage(
        text,
        type = "info",
        duration = 4000
    ) {

        if (!messageBox) {
            return;
        }

        clearTimeout(messageTimer);

        messageBox.textContent = text;
        messageBox.className = type;
        messageBox.style.display = "block";

        if (duration > 0) {

            messageTimer = setTimeout(() => {

                messageBox.style.display = "none";

            }, duration);
        }
    }


    // ========================================================
    // ESCAPE HTML
    // ========================================================

    function escapeHTML(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // ========================================================
    // GET CONTACT ID
    // ========================================================

    function getContactId(contact) {

        if (!contact) {
            return "";
        }

        return String(
            contact._id ||
            contact.id ||
            contact.contactId ||
            ""
        );
    }


    // ========================================================
    // NORMALIZE API RESPONSE
    // ========================================================

    function extractContacts(data) {

        if (Array.isArray(data)) {
            return data;
        }

        if (
            data &&
            Array.isArray(data.contacts)
        ) {
            return data.contacts;
        }

        if (
            data &&
            data.data &&
            Array.isArray(data.data)
        ) {
            return data.data;
        }

        if (
            data &&
            data.data &&
            Array.isArray(data.data.contacts)
        ) {
            return data.data.contacts;
        }

        return [];
    }


    // ========================================================
    // SAFE JSON RESPONSE
    // ========================================================

    async function getResponseData(response) {

        const text = await response.text();

        if (!text) {
            return {};
        }

        try {
            return JSON.parse(text);
        } catch (error) {

            return {
                success: false,
                message: text
            };
        }
    }


    // ========================================================
    // HANDLE UNAUTHORIZED
    // ========================================================

    function handleUnauthorized(response) {

        if (response.status === 401) {

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "/login.html";

            return true;
        }

        return false;
    }


    // ========================================================
    // FORMAT DATE
    // ========================================================

    function formatDate(dateValue) {

        if (!dateValue) {
            return "—";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString(
            undefined,
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    }


    // ========================================================
    // NORMALIZE STATUS
    // ========================================================

    function normalizeStatus(contact) {

        if (
            contact &&
            contact.status
        ) {

            return String(contact.status)
                .trim()
                .toLowerCase();
        }

        return "active";
    }


    // ========================================================
    // DISPLAY CONTACTS
    // ========================================================

    function displayContacts(contacts) {

        if (!contactsTable) {
            return;
        }

        if (
            !Array.isArray(contacts) ||
            contacts.length === 0
        ) {

            contactsTable.innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="empty-row"
                    >
                        No customers found.
                    </td>
                </tr>
            `;

            return;
        }


        contactsTable.innerHTML = contacts
            .map((contact) => {

                const id =
                    getContactId(contact);

                const name =
                    escapeHTML(contact.name || "Unnamed");

                const email =
                    escapeHTML(contact.email || "");

                const status =
                    normalizeStatus(contact);

                const safeStatusClass =
                    [
                        "active",
                        "unsubscribed",
                        "inactive",
                        "bounced"
                    ].includes(status)
                        ? status
                        : "active";

                const createdDate =
                    formatDate(
                        contact.createdAt ||
                        contact.created_at ||
                        contact.date
                    );

                const isUnsubscribed =
                    status === "unsubscribed";


                return `
                    <tr>

                        <td>
                            ${name}
                        </td>

                        <td>
                            ${email}
                        </td>

                        <td>
                            <span class="status ${safeStatusClass}">
                                ${escapeHTML(status)}
                            </span>
                        </td>

                        <td>
                            ${createdDate}
                        </td>

                        <td>

                            <div class="actions">

                                <button
                                    type="button"
                                    class="action-btn edit-btn"
                                    data-action="edit"
                                    data-id="${escapeHTML(id)}"
                                >
                                    Edit
                                </button>

                                ${
                                    isUnsubscribed
                                        ? ""
                                        : `
                                            <button
                                                type="button"
                                                class="action-btn unsubscribe-btn"
                                                data-action="unsubscribe"
                                                data-id="${escapeHTML(id)}"
                                            >
                                                Unsubscribe
                                            </button>
                                        `
                                }

                                <button
                                    type="button"
                                    class="action-btn delete-btn"
                                    data-action="delete"
                                    data-id="${escapeHTML(id)}"
                                >
                                    Delete
                                </button>

                            </div>

                        </td>

                    </tr>
                `;

            })
            .join("");
    }


    // ========================================================
    // FILTER CONTACTS
    // ========================================================

    function filterContacts(searchTerm) {

        const term =
            String(searchTerm || "")
                .trim()
                .toLowerCase();

        if (!term) {
            return allContacts;
        }

        return allContacts.filter((contact) => {

            const name =
                String(contact.name || "")
                    .toLowerCase();

            const email =
                String(contact.email || "")
                    .toLowerCase();

            return (
                name.includes(term) ||
                email.includes(term)
            );
        });
    }


    // ========================================================
    // LOAD CONTACTS
    // ========================================================

    async function loadContacts() {

        if (!contactsTable) {
            console.error(
                "contactsTable element was not found."
            );
            return;
        }

        contactsTable.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="loading-row"
                >
                    Loading customers...
                </td>
            </tr>
        `;


        try {

            const response =
                await fetch(
                    "/api/contacts",
                    {
                        method: "GET",
                        headers: getHeaders()
                    }
                );


            // ----------------------------------------------
            // LOGIN EXPIRED
            // ----------------------------------------------

            if (
                handleUnauthorized(response)
            ) {
                return;
            }


            const data =
                await getResponseData(response);


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to load customers"
                );
            }


            // ----------------------------------------------
            // SAVE CONTACTS IN PAGE STATE
            // ----------------------------------------------

            allContacts =
                extractContacts(data);


            // ----------------------------------------------
            // DISPLAY CONTACTS
            // ----------------------------------------------

            displayContacts(
                filterContacts(
                    searchInput
                        ? searchInput.value
                        : ""
                )
            );


        } catch (error) {

            console.error(
                "Load contacts error:",
                error
            );

            contactsTable.innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="empty-row"
                    >
                        Unable to load customers.
                    </td>
                </tr>
            `;

            showMessage(
                error.message ||
                "Unable to load customers",
                "error"
            );
        }
    }


    // ========================================================
    // ADD CONTACT
    // ========================================================

    async function addContact(event) {

        event.preventDefault();


        if (
            !nameInput ||
            !emailInput
        ) {
            return;
        }


        const name =
            nameInput.value.trim();

        const email =
            emailInput.value
                .trim()
                .toLowerCase();


        // ----------------------------------------------
        // VALIDATION
        // ----------------------------------------------

        if (!name) {

            showMessage(
                "Please enter customer name.",
                "error"
            );

            nameInput.focus();

            return;
        }


        if (!email) {

            showMessage(
                "Please enter customer email.",
                "error"
            );

            emailInput.focus();

            return;
        }


        // Basic browser-level email validation
        if (
            !emailInput.checkValidity()
        ) {

            showMessage(
                "Please enter a valid email address.",
                "error"
            );

            emailInput.focus();

            return;
        }


        // ----------------------------------------------
        // DISABLE BUTTON
        // ----------------------------------------------

        const originalButtonText =
            addContactButton
                ? addContactButton.textContent
                : "Add Customer";


        if (addContactButton) {

            addContactButton.disabled = true;
            addContactButton.textContent =
                "Adding...";
        }


        try {

            // ------------------------------------------
            // POST TO BACKEND
            // ------------------------------------------

            const response =
                await fetch(
                    "/api/contacts",
                    {
                        method: "POST",

                        headers:
                            getHeaders(true),

                        body: JSON.stringify({
                            name,
                            email
                        })
                    }
                );


            if (
                handleUnauthorized(response)
            ) {
                return;
            }


            const data =
                await getResponseData(response);


            // ------------------------------------------
            // HANDLE ERROR
            // ------------------------------------------

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to add customer"
                );
            }


            // ------------------------------------------
            // SUCCESS
            // ------------------------------------------

            showMessage(
                data.message ||
                "Customer added successfully.",
                "success"
            );


            // Clear form
            nameInput.value = "";
            emailInput.value = "";


            // ------------------------------------------
            // IMPORTANT:
            // LOAD AGAIN FROM MONGODB
            // ------------------------------------------

            await loadContacts();


            nameInput.focus();


        } catch (error) {

            console.error(
                "Add contact error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to add customer.",
                "error"
            );


        } finally {

            if (addContactButton) {

                addContactButton.disabled = false;

                addContactButton.textContent =
                    originalButtonText;
            }
        }
    }


    // ========================================================
    // CSV PARSER
    // ========================================================

    function parseCSVLine(line) {

        const values = [];

        let current = "";
        let insideQuotes = false;


        for (
            let i = 0;
            i < line.length;
            i++
        ) {

            const char = line[i];


            if (char === '"') {

                if (
                    insideQuotes &&
                    line[i + 1] === '"'
                ) {

                    current += '"';
                    i++;

                } else {

                    insideQuotes =
                        !insideQuotes;
                }

            } else if (
                char === "," &&
                !insideQuotes
            ) {

                values.push(
                    current.trim()
                );

                current = "";

            } else {

                current += char;
            }
        }


        values.push(
            current.trim()
        );


        return values.map((value) => {

            if (
                value.startsWith('"') &&
                value.endsWith('"')
            ) {

                return value.slice(
                    1,
                    -1
                );
            }

            return value;
        });
    }


    // ========================================================
    // PARSE CSV
    // ========================================================

    function parseCSV(text) {

        const lines =
            text
                .replace(/^\uFEFF/, "")
                .split(/\r?\n/)
                .filter(
                    line => line.trim() !== ""
                );


        if (lines.length < 2) {
            return [];
        }


        const headers =
            parseCSVLine(lines[0])
                .map(header =>
                    header
                        .trim()
                        .toLowerCase()
                );


        const nameIndex =
            headers.indexOf("name");

        const emailIndex =
            headers.indexOf("email");


        if (
            nameIndex === -1 ||
            emailIndex === -1
        ) {

            throw new Error(
                'CSV must contain "name" and "email" columns.'
            );
        }


        const contacts = [];


        for (
            let i = 1;
            i < lines.length;
            i++
        ) {

            const columns =
                parseCSVLine(lines[i]);


            const name =
                String(
                    columns[nameIndex] || ""
                ).trim();

            const email =
                String(
                    columns[emailIndex] || ""
                )
                    .trim()
                    .toLowerCase();


            if (!name || !email) {
                continue;
            }


            contacts.push({
                name,
                email
            });
        }


        return contacts;
    }


    // ========================================================
    // IMPORT CSV
    // ========================================================

    async function importCSV(event) {

        event.preventDefault();


        if (
            !csvFile ||
            !csvFile.files ||
            csvFile.files.length === 0
        ) {

            showMessage(
                "Please select a CSV file.",
                "error"
            );

            return;
        }


        const file =
            csvFile.files[0];


        if (
            !file.name
                .toLowerCase()
                .endsWith(".csv")
        ) {

            showMessage(
                "Please select a valid CSV file.",
                "error"
            );

            return;
        }


        const originalButtonText =
            importButton
                ? importButton.textContent
                : "Import CSV";


        if (importButton) {

            importButton.disabled = true;
            importButton.textContent =
                "Importing...";
        }


        try {

            const text =
                await file.text();


            const contacts =
                parseCSV(text);


            if (
                !contacts.length
            ) {

                throw new Error(
                    "No valid contacts were found in the CSV file."
                );
            }


            // ------------------------------------------
            // SEND CONTACTS TO BACKEND
            // ------------------------------------------

            const response =
                await fetch(
                    "/api/contacts/import",
                    {
                        method: "POST",

                        headers:
                            getHeaders(true),

                        body: JSON.stringify({
                            contacts
                        })
                    }
                );


            if (
                handleUnauthorized(response)
            ) {
                return;
            }


            const data =
                await getResponseData(response);


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to import contacts"
                );
            }


            const imported =
                data.importedCount ??
                data.imported ??
                0;

            const skipped =
                data.skippedCount ??
                data.skipped ??
                0;


            showMessage(
                `Import completed. ${imported} imported, ${skipped} skipped.`,
                "success",
                6000
            );


            // Clear selected file
            csvFile.value = "";


            // ------------------------------------------
            // RELOAD FROM DATABASE
            // ------------------------------------------

            await loadContacts();


        } catch (error) {

            console.error(
                "Import contacts error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to import contacts.",
                "error"
            );


        } finally {

            if (importButton) {

                importButton.disabled = false;

                importButton.textContent =
                    originalButtonText;
            }
        }
    }


    // ========================================================
    // EDIT CONTACT
    // ========================================================

    async function editContact(
        id,
        currentName = "",
        currentEmail = ""
    ) {

        if (!id) {

            showMessage(
                "Invalid customer ID.",
                "error"
            );

            return;
        }


        let name =
            currentName;

        let email =
            currentEmail;


        // ----------------------------------------------
        // GET CURRENT DATA IF NECESSARY
        // ----------------------------------------------

        if (!name || !email) {

            try {

                const response =
                    await fetch(
                        `/api/contacts/${encodeURIComponent(id)}`,
                        {
                            method: "GET",
                            headers: getHeaders()
                        }
                    );


                if (
                    handleUnauthorized(response)
                ) {
                    return;
                }


                const data =
                    await getResponseData(response);


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to get customer"
                    );
                }


                const contact =
                    data.contact ||
                    data.data;


                if (contact) {

                    name =
                        contact.name || "";

                    email =
                        contact.email || "";
                }


            } catch (error) {

                console.error(
                    "Get contact error:",
                    error
                );

                showMessage(
                    error.message ||
                    "Unable to get customer.",
                    "error"
                );

                return;
            }
        }


        // ----------------------------------------------
        // EDIT NAME
        // ----------------------------------------------

        const newName =
            window.prompt(
                "Enter customer name:",
                name
            );


        if (newName === null) {
            return;
        }


        const cleanName =
            newName.trim();


        if (!cleanName) {

            showMessage(
                "Name cannot be empty.",
                "error"
            );

            return;
        }


        // ----------------------------------------------
        // EDIT EMAIL
        // ----------------------------------------------

        const newEmail =
            window.prompt(
                "Enter customer email:",
                email
            );


        if (newEmail === null) {
            return;
        }


        const cleanEmail =
            newEmail
                .trim()
                .toLowerCase();


        if (!cleanEmail) {

            showMessage(
                "Email cannot be empty.",
                "error"
            );

            return;
        }


        // ----------------------------------------------
        // UPDATE BACKEND
        // ----------------------------------------------

        try {

            const response =
                await fetch(
                    `/api/contacts/${encodeURIComponent(id)}`,
                    {
                        method: "PUT",

                        headers:
                            getHeaders(true),

                        body: JSON.stringify({
                            name: cleanName,
                            email: cleanEmail
                        })
                    }
                );


            if (
                handleUnauthorized(response)
            ) {
                return;
            }


            const data =
                await getResponseData(response);


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to update customer"
                );
            }


            showMessage(
                data.message ||
                "Customer updated successfully.",
                "success"
            );


            // ------------------------------------------
            // RELOAD FROM DATABASE
            // ------------------------------------------

            await loadContacts();


        } catch (error) {

            console.error(
                "Update contact error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to update customer.",
                "error"
            );
        }
    }


    // ========================================================
    // UNSUBSCRIBE CONTACT
    // ========================================================

    async function unsubscribeContact(id) {

        if (!id) {

            showMessage(
                "Invalid customer ID.",
                "error"
            );

            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to unsubscribe this customer?"
            );


        if (!confirmed) {
            return;
        }


        try {

            const response =
                await fetch(
                    `/api/contacts/${encodeURIComponent(id)}/unsubscribe`,
                    {
                        method: "PUT",
                        headers: getHeaders()
                    }
                );


            if (
                handleUnauthorized(response)
            ) {
                return;
            }


            const data =
                await getResponseData(response);


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to unsubscribe customer"
                );
            }


            showMessage(
                data.message ||
                "Customer unsubscribed successfully.",
                "success"
            );


            // ------------------------------------------
            // RELOAD FROM DATABASE
            // ------------------------------------------

            await loadContacts();


        } catch (error) {

            console.error(
                "Unsubscribe error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to unsubscribe customer.",
                "error"
            );
        }
    }


    // ========================================================
    // DELETE CONTACT
    // ========================================================

    async function deleteContact(id) {

        if (!id) {

            showMessage(
                "Invalid customer ID.",
                "error"
            );

            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to permanently delete this customer?"
            );


        if (!confirmed) {
            return;
        }


        try {

            const response =
                await fetch(
                    `/api/contacts/${encodeURIComponent(id)}`,
                    {
                        method: "DELETE",
                        headers: getHeaders()
                    }
                );


            if (
                handleUnauthorized(response)
            ) {
                return;
            }


            const data =
                await getResponseData(response);


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to delete customer"
                );
            }


            showMessage(
                data.message ||
                "Customer deleted successfully.",
                "success"
            );


            // ------------------------------------------
            // RELOAD FROM DATABASE
            // ------------------------------------------

            await loadContacts();


        } catch (error) {

            console.error(
                "Delete contact error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to delete customer.",
                "error"
            );
        }
    }


    // ========================================================
    // TABLE ACTION HANDLER
    // ========================================================

    if (contactsTable) {

        contactsTable.addEventListener(
            "click",
            (event) => {

                const button =
                    event.target.closest(
                        "button[data-action]"
                    );


                if (!button) {
                    return;
                }


                const action =
                    button.dataset.action;

                const id =
                    button.dataset.id;


                if (!id) {
                    return;
                }


                // --------------------------------------
                // FIND CONTACT IN CURRENT DATA
                // --------------------------------------

                const contact =
                    allContacts.find(
                        item =>
                            getContactId(item) ===
                            String(id)
                    );


                if (action === "edit") {

                    editContact(
                        id,
                        contact
                            ? contact.name
                            : "",
                        contact
                            ? contact.email
                            : ""
                    );

                    return;
                }


                if (
                    action === "unsubscribe"
                ) {

                    unsubscribeContact(id);

                    return;
                }


                if (action === "delete") {

                    deleteContact(id);

                    return;
                }
            }
        );
    }


    // ========================================================
    // SEARCH
    // ========================================================

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                const filtered =
                    filterContacts(
                        searchInput.value
                    );

                displayContacts(filtered);
            }
        );
    }


    // ========================================================
    // ADD FORM EVENT
    // ========================================================

    if (contactForm) {

        contactForm.addEventListener(
            "submit",
            addContact
        );
    }


    // ========================================================
    // IMPORT FORM EVENT
    // ========================================================

    if (importForm) {

        importForm.addEventListener(
            "submit",
            importCSV
        );
    }


    // ========================================================
    // LOGOUT
    // ========================================================

    function logout() {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href =
            "/login.html";
    }


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );
    }


    // ========================================================
    // GLOBAL FUNCTIONS
    // ========================================================
    // These allow other existing code to call them if needed.

    window.editContact =
        editContact;

    window.unsubscribeContact =
        unsubscribeContact;

    window.deleteContact =
        deleteContact;

    window.logout =
        logout;


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    loadContacts();

});