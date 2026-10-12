document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // CHECK LOGIN
    // ==========================================

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
        window.location.href = "/login.html";
        return;
    }


    // ==========================================
    // DOM ELEMENTS
    // ==========================================

    const userNameElement =
        document.getElementById("userName");

    const userEmailElement =
        document.getElementById("userEmail");


    // ==========================================
    // EXISTING ANALYTICS ELEMENTS
    // ==========================================

    const totalCampaignsElement =
        document.getElementById("totalCampaigns");

    const sentCampaignsElement =
        document.getElementById("sentCampaigns");

    const draftCampaignsElement =
        document.getElementById("draftCampaigns");

    const failedCampaignsElement =
        document.getElementById("failedCampaigns");

    const totalEmailsSentElement =
        document.getElementById("totalEmailsSent");

    const deliveryRateElement =
        document.getElementById("deliveryRate");


    // ==========================================
    // OVERALL ANALYTICS ELEMENTS
    // ==========================================

    const analyticsTotalCampaigns =
        document.getElementById(
            "analyticsTotalCampaigns"
        );

    const analyticsSentCampaigns =
        document.getElementById(
            "analyticsSentCampaigns"
        );

    const analyticsDraftCampaigns =
        document.getElementById(
            "analyticsDraftCampaigns"
        );

    const analyticsFailedCampaigns =
        document.getElementById(
            "analyticsFailedCampaigns"
        );

    const analyticsSendingCampaigns =
        document.getElementById(
            "analyticsSendingCampaigns"
        );

    const analyticsTotalRecipients =
        document.getElementById(
            "analyticsTotalRecipients"
        );

    const analyticsTotalSent =
        document.getElementById(
            "analyticsTotalSent"
        );

    const analyticsTotalFailed =
        document.getElementById(
            "analyticsTotalFailed"
        );

    const analyticsTotalSkipped =
        document.getElementById(
            "analyticsTotalSkipped"
        );

    const analyticsDeliveryRate =
        document.getElementById(
            "analyticsDeliveryRate"
        );

    const analyticsFailureRate =
        document.getElementById(
            "analyticsFailureRate"
        );

    const analyticsSkipRate =
        document.getElementById(
            "analyticsSkipRate"
        );


    // ==========================================
    // RECENT CAMPAIGNS
    // ==========================================

    const recentCampaignsElement =
        document.getElementById(
            "recentCampaigns"
        );


    // ==========================================
    // LOGOUT
    // ==========================================

    const logoutButton =
        document.getElementById("logoutBtn") ||
        document.getElementById("logoutButton");


    // ==========================================
    // API HELPER
    // ==========================================

    async function apiRequest(url, options = {}) {

        const requestOptions = {
            ...options,

            headers: {
                "Content-Type":
                    "application/json",

                ...(options.headers || {}),

                Authorization:
                    `Bearer ${token}`
            }
        };


        const response =
            await fetch(
                url,
                requestOptions
            );


        // ======================================
        // AUTHENTICATION ERROR
        // ======================================

        if (response.status === 401) {

            logout();

            return null;
        }


        // ======================================
        // READ RESPONSE
        // ======================================

        let data = null;

        try {

            data =
                await response.json();

        } catch (error) {

            data = null;
        }


        // ======================================
        // HANDLE API ERROR
        // ======================================

        if (!response.ok) {

            const message =
                data?.message ||
                data?.error ||
                "Something went wrong.";

            throw new Error(message);
        }


        return data;
    }


    // ==========================================
    // LOAD USER INFORMATION
    // ==========================================

    function loadUserInfo() {

        try {

            const user =
                JSON.parse(userData);


            if (userNameElement) {

                userNameElement.textContent =
                    user.name ||
                    user.username ||
                    "User";
            }


            if (userEmailElement) {

                userEmailElement.textContent =
                    user.email ||
                    "";
            }

        } catch (error) {

            console.error(
                "Failed to load user information:",
                error
            );


            if (userNameElement) {

                userNameElement.textContent =
                    "User";
            }
        }
    }


    // ==========================================
    // FORMAT NUMBER
    // ==========================================

    function formatNumber(value) {

        const number =
            Number(value);


        if (!Number.isFinite(number)) {

            return "0";
        }


        return number.toLocaleString();
    }


    // ==========================================
    // FORMAT PERCENTAGE
    // ==========================================

    function formatPercentage(value) {

        const number =
            Number(value);


        if (!Number.isFinite(number)) {

            return "0%";
        }


        return `${number.toFixed(2)}%`;
    }


    // ==========================================
    // UPDATE ELEMENT SAFELY
    // ==========================================

    function setText(element, value) {

        if (element) {

            element.textContent =
                value;
        }
    }


    // ==========================================
    // UPDATE OVERALL ANALYTICS
    // ==========================================

    function updateAnalytics(analytics) {

        if (!analytics) {

            return;
        }


        console.log(
            "Overall campaign analytics:",
            analytics
        );


        // ======================================
        // CAMPAIGN COUNTS
        // ======================================

        const totalCampaigns =
            analytics.totalCampaigns ??
            analytics.total ??
            0;


        const sentCampaigns =
            analytics.sentCampaigns ??
            analytics.sent ??
            0;


        const draftCampaigns =
            analytics.draftCampaigns ??
            analytics.drafts ??
            analytics.draft ??
            0;


        const failedCampaigns =
            analytics.failedCampaigns ??
            analytics.failed ??
            0;


        const sendingCampaigns =
            analytics.sendingCampaigns ??
            analytics.sending ??
            0;


        // ======================================
        // EMAIL COUNTS
        // ======================================

        const totalRecipients =
            analytics.totalRecipients ??
            0;


        const totalSent =
            analytics.totalSent ??
            analytics.totalEmailsSent ??
            analytics.emailsSent ??
            0;


        const totalFailed =
            analytics.totalFailed ??
            0;


        const totalSkipped =
            analytics.totalSkipped ??
            0;


        // ======================================
        // RATES
        // ======================================

        let deliveryRate =
            analytics.deliveryRate;


        let failureRate =
            analytics.failureRate;


        let skipRate =
            analytics.skipRate;


        // ======================================
        // CALCULATE DELIVERY RATE IF NEEDED
        // ======================================

        if (
            deliveryRate === undefined ||
            deliveryRate === null
        ) {

            deliveryRate =
                totalRecipients > 0
                    ? (
                        Number(totalSent) /
                        Number(totalRecipients)
                    ) * 100
                    : 0;
        }


        // ======================================
        // CALCULATE FAILURE RATE IF NEEDED
        // ======================================

        if (
            failureRate === undefined ||
            failureRate === null
        ) {

            failureRate =
                totalRecipients > 0
                    ? (
                        Number(totalFailed) /
                        Number(totalRecipients)
                    ) * 100
                    : 0;
        }


        // ======================================
        // CALCULATE SKIP RATE IF NEEDED
        // ======================================

        if (
            skipRate === undefined ||
            skipRate === null
        ) {

            skipRate =
                totalRecipients > 0
                    ? (
                        Number(totalSkipped) /
                        Number(totalRecipients)
                    ) * 100
                    : 0;
        }


        // ======================================
        // UPDATE OLD / EXISTING DASHBOARD CARDS
        // ======================================

        setText(
            totalCampaignsElement,
            formatNumber(totalCampaigns)
        );


        setText(
            sentCampaignsElement,
            formatNumber(sentCampaigns)
        );


        setText(
            draftCampaignsElement,
            formatNumber(draftCampaigns)
        );


        setText(
            failedCampaignsElement,
            formatNumber(failedCampaigns)
        );


        setText(
            totalEmailsSentElement,
            formatNumber(totalSent)
        );


        setText(
            deliveryRateElement,
            formatPercentage(deliveryRate)
        );


        // ======================================
        // UPDATE ALL OVERALL ANALYTICS CARDS
        // ======================================

        setText(
            analyticsTotalCampaigns,
            formatNumber(totalCampaigns)
        );


        setText(
            analyticsSentCampaigns,
            formatNumber(sentCampaigns)
        );


        setText(
            analyticsDraftCampaigns,
            formatNumber(draftCampaigns)
        );


        setText(
            analyticsFailedCampaigns,
            formatNumber(failedCampaigns)
        );


        setText(
            analyticsSendingCampaigns,
            formatNumber(sendingCampaigns)
        );


        setText(
            analyticsTotalRecipients,
            formatNumber(totalRecipients)
        );


        setText(
            analyticsTotalSent,
            formatNumber(totalSent)
        );


        setText(
            analyticsTotalFailed,
            formatNumber(totalFailed)
        );


        setText(
            analyticsTotalSkipped,
            formatNumber(totalSkipped)
        );


        setText(
            analyticsDeliveryRate,
            formatPercentage(deliveryRate)
        );


        setText(
            analyticsFailureRate,
            formatPercentage(failureRate)
        );


        setText(
            analyticsSkipRate,
            formatPercentage(skipRate)
        );
    }


    // ==========================================
    // RESET ANALYTICS
    // ==========================================

    function resetAnalytics() {

        const numberElements = [

            totalCampaignsElement,
            sentCampaignsElement,
            draftCampaignsElement,
            failedCampaignsElement,
            totalEmailsSentElement,

            analyticsTotalCampaigns,
            analyticsSentCampaigns,
            analyticsDraftCampaigns,
            analyticsFailedCampaigns,
            analyticsSendingCampaigns,
            analyticsTotalRecipients,
            analyticsTotalSent,
            analyticsTotalFailed,
            analyticsTotalSkipped

        ];


        numberElements.forEach(
            element => {

                setText(
                    element,
                    "0"
                );
            }
        );


        const percentageElements = [

            deliveryRateElement,
            analyticsDeliveryRate,
            analyticsFailureRate,
            analyticsSkipRate

        ];


        percentageElements.forEach(
            element => {

                setText(
                    element,
                    "0%"
                );
            }
        );
    }


    // ==========================================
    // LOAD OVERALL ANALYTICS
    // ==========================================

    async function loadAnalytics() {

        try {

            const data =
                await apiRequest(
                    "/api/campaigns/analytics/overall"
                );


            if (!data) {

                return;
            }


            /*
             * Backend response:
             *
             * {
             *     success: true,
             *     analytics: {
             *         totalCampaigns,
             *         sentCampaigns,
             *         draftCampaigns,
             *         failedCampaigns,
             *         sendingCampaigns,
             *         totalRecipients,
             *         totalSent,
             *         totalFailed,
             *         totalSkipped,
             *         deliveryRate,
             *         failureRate,
             *         skipRate
             *     }
             * }
             */


            const analytics =
                data.analytics ||
                data.data ||
                data;


            updateAnalytics(
                analytics
            );

        } catch (error) {

            console.error(
                "Failed to load campaign analytics:",
                error
            );


            resetAnalytics();
        }
    }


    // ==========================================
    // LOAD RECENT CAMPAIGNS
    // ==========================================

    async function loadRecentCampaigns() {

        try {

            const data =
                await apiRequest(
                    "/api/campaigns"
                );


            if (!data) {

                return;
            }


            const campaigns =
                Array.isArray(data)
                    ? data
                    : data.campaigns ||
                      data.data ||
                      [];


            displayRecentCampaigns(
                campaigns
            );

        } catch (error) {

            console.error(
                "Failed to load campaigns:",
                error
            );


            if (recentCampaignsElement) {

                recentCampaignsElement.innerHTML = `
                    <div class="empty-state">
                        Unable to load campaigns.
                    </div>
                `;
            }
        }
    }


    // ==========================================
    // DISPLAY RECENT CAMPAIGNS
    // ==========================================

    function displayRecentCampaigns(campaigns) {

    const container = document.getElementById("recentCampaigns");
    const countElement = document.getElementById("recentCampaignCount");

    if (!container) {
        return;
    }

    if (!Array.isArray(campaigns) || campaigns.length === 0) {

        container.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="no-campaigns">
                        No campaigns found.
                    </div>
                </td>
            </tr>
        `;

        if (countElement) {
            countElement.textContent =
                "Showing 0 of your recent campaigns";
        }

        return;
    }


    // Sort newest campaigns first
    const sortedCampaigns = [...campaigns].sort((a, b) => {

        const dateA = new Date(
            a.sentAt ||
            a.createdAt ||
            a.updatedAt ||
            0
        );

        const dateB = new Date(
            b.sentAt ||
            b.createdAt ||
            b.updatedAt ||
            0
        );

        return dateB - dateA;
    });


    // Show latest 5
    const recentCampaigns = sortedCampaigns.slice(0, 5);


    container.innerHTML = recentCampaigns.map(campaign => {

        const status = String(
            campaign.status || "draft"
        ).toLowerCase();

        const campaignName =
            campaign.name ||
            campaign.campaignName ||
            "Untitled Campaign";

        const subject =
            campaign.subject ||
            "No subject";

        const campaignId =
            campaign._id ||
            campaign.id ||
            "";


        const recipients = Number(
            campaign.totalRecipients ??
            campaign.recipientsCount ??
            campaign.recipientCount ??
            0
        );


        const sent = Number(
            campaign.sentCount ??
            campaign.totalSent ??
            campaign.sent ??
            0
        );


        const failed = Number(
            campaign.failedCount ??
            campaign.totalFailed ??
            campaign.failed ??
            0
        );


        const skipped = Number(
            campaign.skippedCount ??
            campaign.totalSkipped ??
            campaign.skipped ??
            0
        );


        const dateValue =
            campaign.sentAt ||
            campaign.createdAt ||
            campaign.updatedAt;


        let dateText = "-";
        let timeText = "";

        if (dateValue) {

            const date = new Date(dateValue);

            if (!isNaN(date.getTime())) {

                dateText = date.toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                    }
                );

                timeText = date.toLocaleTimeString(
                    "en-US",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );
            }
        }


        let statusClass = "draft";

        if (status === "sent") {
            statusClass = "sent";
        } else if (status === "failed") {
            statusClass = "failed";
        } else if (status === "sending") {
            statusClass = "sending";
        }


        let statusText =
            status.charAt(0).toUpperCase() +
            status.slice(1);


        const icon =
            status === "sent"
                ? "➤"
                : status === "failed"
                    ? "✕"
                    : "▤";


        return `
            <tr>

                <!-- Campaign -->
                <td>
                    <div class="campaign-name-wrapper">

                        <div class="campaign-type-icon ${statusClass}">
                            ${icon}
                        </div>

                        <div class="campaign-name">

                            <strong>
                                ${escapeHtml(campaignName)}
                            </strong>

                            <span class="campaign-id">
                                ID: ${escapeHtml(String(campaignId))}
                            </span>

                        </div>

                    </div>
                </td>


                <!-- Subject -->
                <td>
                    <span class="campaign-subject">
                        ${escapeHtml(subject)}
                    </span>
                </td>


                <!-- Status -->
                <td>
                    <span class="campaign-status ${statusClass}">
                        ${escapeHtml(statusText)}
                    </span>
                </td>


                <!-- Recipients -->
                <td>
                    <span class="campaign-number">
                        ${formatNumber(recipients)}
                    </span>
                </td>


                <!-- Sent -->
                <td>
                    <span class="campaign-number sent">
                        ${formatNumber(sent)}
                    </span>
                </td>


                <!-- Failed -->
                <td>
                    <span class="campaign-number failed">
                        ${formatNumber(failed)}
                    </span>
                </td>


                <!-- Skipped -->
                <td>
                    <span class="campaign-number skipped">
                        ${formatNumber(skipped)}
                    </span>
                </td>


                <!-- Date -->
                <td>

                    <div class="campaign-date">

                        <span class="campaign-date-main">
                            📅 ${escapeHtml(dateText)}
                        </span>

                        ${
                            timeText
                                ? `<span class="campaign-time">
                                     ${escapeHtml(timeText)}
                                   </span>`
                                : ""
                        }

                    </div>

                </td>

            </tr>
        `;

    }).join("");


    if (countElement) {

        countElement.textContent =
            `Showing ${recentCampaigns.length} of your recent campaigns`;
    }
}


    // ==========================================
    // ESCAPE HTML
    // ==========================================

    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";
        }


        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    // ==========================================
    // LOGOUT
    // ==========================================

    function logout() {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "user"
        );


        window.location.href =
            "/login.html";
    }

    function viewCampaign(id) {

    if (!id) {
        return;
    }

    // Open the campaign details endpoint
    // in a new browser tab.
    window.open(
        `/api/campaigns/${encodeURIComponent(id)}`,
        "_blank"
    );
}


function viewCampaignAnalytics(id) {

    if (!id) {
        return;
    }

    window.open(
        `/api/campaigns/${encodeURIComponent(id)}/analytics`,
        "_blank"
    );
}


function editCampaign(id) {

    if (!id) {
        return;
    }

    // For now, keep the campaign ID available
    // for the campaign editor we can connect later.
    console.log("Edit campaign:", id);
}

    // ==========================================
    // LOGOUT BUTTON
    // ==========================================

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );
    }


    // ==========================================
    // GLOBAL LOGOUT
    // ==========================================

    window.logout =
        logout;


    // ==========================================
    // INITIALIZE DASHBOARD
    // ==========================================

    console.log(
        "dashboard.js loaded successfully"
    );


    loadUserInfo();

    loadAnalytics();

    loadRecentCampaigns();

    editCampaign();

    viewCampaignAnalytics();

    viewCampaign();

});