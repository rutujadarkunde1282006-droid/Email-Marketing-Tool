const mongoose = require("mongoose");

const Campaign = require("../models/Campaign");
const Contact = require("../models/Contact");

const { transporter } = require("../config/email");

// ==========================================
// PERSONALIZE TEMPLATE
// ==========================================

function personalizeText(text, contact) {
    if (!text) {
        return "";
    }

    const name =
        contact && contact.name
            ? String(contact.name)
            : "";

    return String(text).replace(
        /\{\{\s*name\s*\}\}/gi,
        name
    );
}

// ==========================================
// VALIDATE MONGODB OBJECT ID
// ==========================================

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

// ==========================================
// CREATE CAMPAIGN
// ==========================================

const createCampaign = async (req, res) => {
    try {
        const {
            name,
            subject,
            content,
            recipients
        } = req.body;

        // ----------------------------------------
        // VALIDATE BASIC FIELDS
        // ----------------------------------------

        if (
            !name ||
            !subject ||
            !content
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, subject and content are required"
            });
        }

        const cleanName = String(name).trim();
        const cleanSubject = String(subject).trim();
        const cleanContent = String(content);

        if (!cleanName) {
            return res.status(400).json({
                success: false,
                message:
                    "Campaign name cannot be empty"
            });
        }

        if (!cleanSubject) {
            return res.status(400).json({
                success: false,
                message:
                    "Campaign subject cannot be empty"
            });
        }

        if (!cleanContent.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Campaign content cannot be empty"
            });
        }

        // ----------------------------------------
        // VALIDATE RECIPIENTS
        // ----------------------------------------

        if (
            !Array.isArray(recipients) ||
            recipients.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please select at least one customer"
            });
        }

        // ----------------------------------------
        // REMOVE DUPLICATE CONTACT IDS
        // ----------------------------------------

        const uniqueRecipients = [
            ...new Set(
                recipients.map((id) => String(id))
            )
        ];

        // ----------------------------------------
        // VALIDATE CONTACT IDS
        // ----------------------------------------

        const invalidIds = uniqueRecipients.filter(
            (id) => !isValidObjectId(id)
        );

        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "One or more selected customers are invalid"
            });
        }

        // ----------------------------------------
        // VERIFY CONTACTS BELONG TO USER
        // ----------------------------------------

        const validContacts = await Contact.find({
            _id: {
                $in: uniqueRecipients
            },
            userId: req.userId
        });

        if (
            validContacts.length !==
            uniqueRecipients.length
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Invalid customer selection"
            });
        }

        // ----------------------------------------
        // CREATE CAMPAIGN
        // ----------------------------------------

        const campaign = await Campaign.create({
            userId: req.userId,
            name: cleanName,
            subject: cleanSubject,
            content: cleanContent,
            recipients: uniqueRecipients,
            totalRecipients:
                uniqueRecipients.length,
            sentCount: 0,
            failedCount: 0,
            skippedCount: 0,
            status: "draft",
            sentAt: null
        });

        res.status(201).json({
            success: true,
            message:
                "Campaign created successfully",
            campaign
        });

    } catch (error) {
        console.error(
            "Create campaign error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while creating campaign"
        });
    }
};

// ==========================================
// GET ALL CAMPAIGNS
// ==========================================

const getCampaigns = async (req, res) => {
    try {
        const campaigns =
            await Campaign.find({
                userId: req.userId
            })
                .populate(
                    "recipients",
                    "name email status"
                )
                .sort({
                    createdAt: -1
                });

        res.json({
            success: true,
            count: campaigns.length,
            campaigns
        });

    } catch (error) {
        console.error(
            "Get campaigns error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while getting campaigns"
        });
    }
};

// ==========================================
// GET SINGLE CAMPAIGN
// ==========================================

const getCampaign = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid campaign ID"
            });
        }

        const campaign =
            await Campaign.findOne({
                _id: req.params.id,
                userId: req.userId
            })
                .populate(
                    "recipients",
                    "name email status"
                );

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message:
                    "Campaign not found"
            });
        }

        res.json({
            success: true,
            campaign
        });

    } catch (error) {
        console.error(
            "Get campaign error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error"
        });
    }
};

// ==========================================
// UPDATE CAMPAIGN
// ==========================================

const updateCampaign = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid campaign ID"
            });
        }

        const campaign =
            await Campaign.findOne({
                _id: req.params.id,
                userId: req.userId
            });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message:
                    "Campaign not found"
            });
        }

        // ----------------------------------------
        // PREVENT EDITING SENT/SENDING CAMPAIGNS
        // ----------------------------------------

        if (
            campaign.status === "sent" ||
            campaign.status === "sending"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This campaign cannot be edited"
            });
        }

        const {
            name,
            subject,
            content,
            recipients
        } = req.body;

        // ----------------------------------------
        // UPDATE NAME
        // ----------------------------------------

        if (name !== undefined) {
            const cleanName =
                String(name).trim();

            if (!cleanName) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Campaign name cannot be empty"
                });
            }

            campaign.name = cleanName;
        }

        // ----------------------------------------
        // UPDATE SUBJECT
        // ----------------------------------------

        if (subject !== undefined) {
            const cleanSubject =
                String(subject).trim();

            if (!cleanSubject) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Campaign subject cannot be empty"
                });
            }

            campaign.subject =
                cleanSubject;
        }

        // ----------------------------------------
        // UPDATE CONTENT
        // ----------------------------------------

        if (content !== undefined) {
            const cleanContent =
                String(content);

            if (!cleanContent.trim()) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Campaign content cannot be empty"
                });
            }

            campaign.content =
                cleanContent;
        }

        // ----------------------------------------
        // UPDATE RECIPIENTS
        // ----------------------------------------

        if (recipients !== undefined) {
            if (
                !Array.isArray(recipients) ||
                recipients.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please select at least one customer"
                });
            }

            const uniqueRecipients = [
                ...new Set(
                    recipients.map((id) =>
                        String(id)
                    )
                )
            ];

            const invalidIds =
                uniqueRecipients.filter(
                    (id) =>
                        !isValidObjectId(id)
                );

            if (invalidIds.length > 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "One or more selected customers are invalid"
                });
            }

            const validContacts =
                await Contact.find({
                    _id: {
                        $in: uniqueRecipients
                    },
                    userId: req.userId
                });

            if (
                validContacts.length !==
                uniqueRecipients.length
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Invalid customer selection"
                });
            }

            campaign.recipients =
                uniqueRecipients;

            campaign.totalRecipients =
                uniqueRecipients.length;
        }

        await campaign.save();

        res.json({
            success: true,
            message:
                "Campaign updated successfully",
            campaign
        });

    } catch (error) {
        console.error(
            "Update campaign error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while updating campaign"
        });
    }
};

// ==========================================
// DELETE CAMPAIGN
// ==========================================

const deleteCampaign = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid campaign ID"
            });
        }

        const campaign =
            await Campaign.findOneAndDelete({
                _id: req.params.id,
                userId: req.userId
            });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message:
                    "Campaign not found"
            });
        }

        res.json({
            success: true,
            message:
                "Campaign deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete campaign error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while deleting campaign"
        });
    }
};

// ==========================================
// SEND CAMPAIGN
// ==========================================

const sendCampaign = async (req, res) => {
    try {
        // ----------------------------------------
        // VALIDATE CAMPAIGN ID
        // ----------------------------------------

        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid campaign ID"
            });
        }

        // ----------------------------------------
        // FIND CAMPAIGN
        // ----------------------------------------

        const campaign =
            await Campaign.findOne({
                _id: req.params.id,
                userId: req.userId
            })
                .populate(
                    "recipients",
                    "name email status"
                );

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message:
                    "Campaign not found"
            });
        }

        // ----------------------------------------
        // PREVENT DUPLICATE SENDING
        // ----------------------------------------

        if (
            campaign.status === "sending"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Campaign is already being sent"
            });
        }

        if (
            campaign.status === "sent"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "This campaign has already been sent"
            });
        }

        // ----------------------------------------
        // ORIGINAL SELECTED COUNT
        // ----------------------------------------

        const selectedRecipientCount =
            campaign.recipients.length;

        // ----------------------------------------
        // FIND ACTIVE CONTACTS
        // ----------------------------------------

        const recipients =
            campaign.recipients.filter(
                (contact) => {
                    return (
                        contact &&
                        contact.status ===
                            "active" &&
                        contact.email &&
                        contact.email
                            .trim() !== ""
                    );
                }
            );

        // ----------------------------------------
        // CALCULATE SKIPPED CONTACTS
        // ----------------------------------------

        const skippedCount =
            selectedRecipientCount -
            recipients.length;

        // ----------------------------------------
        // NO VALID RECIPIENTS
        // ----------------------------------------

        if (recipients.length === 0) {
            campaign.status =
                "failed";

            campaign.totalRecipients =
                selectedRecipientCount;

            campaign.sentCount = 0;

            campaign.failedCount = 0;

            campaign.skippedCount =
                skippedCount;

            campaign.sentAt = null;

            await campaign.save();

            return res.status(400).json({
                success: false,
                message:
                    "No active customers with valid email addresses available",
                totalRecipients:
                    selectedRecipientCount,
                sentCount: 0,
                failedCount: 0,
                skippedCount,
                status: "failed"
            });
        }

        // ----------------------------------------
        // MARK CAMPAIGN AS SENDING
        // ----------------------------------------

        campaign.status = "sending";

        campaign.totalRecipients =
            selectedRecipientCount;

        campaign.sentCount = 0;

        campaign.failedCount = 0;

        campaign.skippedCount =
            skippedCount;

        campaign.sentAt = null;

        await campaign.save();

        // ----------------------------------------
        // SEND EMAILS IN BATCHES
        // ----------------------------------------

        let sentCount = 0;
        let failedCount = 0;

        const batchSize = 10;

        for (
            let i = 0;
            i < recipients.length;
            i += batchSize
        ) {
            const batch =
                recipients.slice(
                    i,
                    i + batchSize
                );

            for (const contact of batch) {
                try {
                    // --------------------------------
                    // PERSONALIZE SUBJECT
                    // --------------------------------

                    const personalizedSubject =
                        personalizeText(
                            campaign.subject,
                            contact
                        );

                    // --------------------------------
                    // PERSONALIZE CONTENT
                    // --------------------------------

                    const personalizedContent =
                        personalizeText(
                            campaign.content,
                            contact
                        );

                    // --------------------------------
                    // UNSUBSCRIBE URL
                    // --------------------------------

                    const appUrl =
                        process.env.APP_URL ||
                        "http://localhost:3000";

                    const unsubscribeUrl =
                        `${appUrl}/unsubscribe.html?contact=${contact._id}`;

                    // --------------------------------
                    // SEND EMAIL
                    // --------------------------------

                    await transporter.sendMail({
                        from:
                            `"Email Marketing Tool" <${process.env.SMTP_USER}>`,

                        to: contact.email,

                        subject:
                            personalizedSubject,

                        html: `
                            <div>
                                ${personalizedContent}
                            </div>

                            <hr>

                            <p>
                                You are receiving this email because
                                you are subscribed to our email list.
                            </p>

                            <p>
                                <a href="${unsubscribeUrl}">
                                    Unsubscribe
                                </a>
                            </p>
                        `
                    });

                    sentCount++;

                    console.log(
                        `Campaign email sent to: ${contact.email}`
                    );

                } catch (emailError) {
                    failedCount++;

                    console.error(
                        `Failed to send to ${contact.email}:`,
                        emailError.message
                    );
                }
            }

            // ----------------------------------------
            // SAVE PROGRESS
            // ----------------------------------------

            campaign.sentCount =
                sentCount;

            campaign.failedCount =
                failedCount;

            campaign.skippedCount =
                skippedCount;

            await campaign.save();

            // ----------------------------------------
            // DELAY BETWEEN BATCHES
            // ----------------------------------------

            if (
                i + batchSize <
                recipients.length
            ) {
                await new Promise(
                    (resolve) =>
                        setTimeout(
                            resolve,
                            1000
                        )
                );
            }
        }

        // ----------------------------------------
        // FINAL STATISTICS
        // ----------------------------------------

        campaign.totalRecipients =
            selectedRecipientCount;

        campaign.sentCount =
            sentCount;

        campaign.failedCount =
            failedCount;

        campaign.skippedCount =
            skippedCount;

        // ----------------------------------------
        // FINAL STATUS
        // ----------------------------------------

        if (sentCount === 0) {
            campaign.status =
                "failed";

            campaign.sentAt = null;

        } else {
            campaign.status =
                "sent";

            campaign.sentAt =
                new Date();
        }

        await campaign.save();

        // ----------------------------------------
        // RESPONSE
        // ----------------------------------------

        res.json({
            success: true,
            message:
                `Campaign processed. ${sentCount} email(s) sent.`,

            totalRecipients:
                campaign.totalRecipients,

            sentCount:
                campaign.sentCount,

            failedCount:
                campaign.failedCount,

            skippedCount:
                campaign.skippedCount,

            status:
                campaign.status
        });

    } catch (error) {
        console.error(
            "Send campaign error:",
            error
        );

        // ----------------------------------------
        // MARK CAMPAIGN FAILED
        // ----------------------------------------

        try {
            await Campaign.findOneAndUpdate(
                {
                    _id: req.params.id,
                    userId: req.userId
                },
                {
                    status: "failed"
                }
            );
        } catch (updateError) {
            console.error(
                "Could not update campaign status:",
                updateError.message
            );
        }

        res.status(500).json({
            success: false,
            message:
                "Server error while sending campaign"
        });
    }
};


// ==========================================
// GET CAMPAIGN ANALYTICS
// ==========================================

const getCampaignAnalytics = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found"
      });
    }

    const totalRecipients = Number(
      campaign.totalRecipients || 0
    );

    const sentCount = Number(
      campaign.sentCount || 0
    );

    const failedCount = Number(
      campaign.failedCount || 0
    );

    const skippedCount = Number(
      campaign.skippedCount || 0
    );

    const processedCount =
      sentCount +
      failedCount +
      skippedCount;

    const deliveryRate =
      totalRecipients > 0
        ? Number(
            (
              (sentCount / totalRecipients) *
              100
            ).toFixed(2)
          )
        : 0;

    const failureRate =
      totalRecipients > 0
        ? Number(
            (
              (failedCount / totalRecipients) *
              100
            ).toFixed(2)
          )
        : 0;

    const skipRate =
      totalRecipients > 0
        ? Number(
            (
              (skippedCount / totalRecipients) *
              100
            ).toFixed(2)
          )
        : 0;

    res.json({
      success: true,

      analytics: {
        campaignId: campaign._id,
        campaignName: campaign.name,
        subject: campaign.subject,
        status: campaign.status,

        totalRecipients,
        sentCount,
        failedCount,
        skippedCount,
        processedCount,

        deliveryRate,
        failureRate,
        skipRate,

        sentAt: campaign.sentAt,
        createdAt: campaign.createdAt
      }
    });

  } catch (error) {
    console.error(
      "Get campaign analytics error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while getting campaign analytics"
    });
  }
};


// ==========================================
// GET OVERALL CAMPAIGN ANALYTICS
// ==========================================

const getOverallAnalytics = async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      userId: req.userId
    });

    const totalCampaigns = campaigns.length;

    let sentCampaigns = 0;
    let draftCampaigns = 0;
    let failedCampaigns = 0;
    let sendingCampaigns = 0;

    let totalRecipients = 0;
    let totalSent = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    campaigns.forEach((campaign) => {

      // Campaign status counts
      if (campaign.status === "sent") {
        sentCampaigns++;
      }

      if (campaign.status === "draft") {
        draftCampaigns++;
      }

      if (campaign.status === "failed") {
        failedCampaigns++;
      }

      if (campaign.status === "sending") {
        sendingCampaigns++;
      }

      // Email statistics
      totalRecipients += Number(
        campaign.totalRecipients || 0
      );

      totalSent += Number(
        campaign.sentCount || 0
      );

      totalFailed += Number(
        campaign.failedCount || 0
      );

      totalSkipped += Number(
        campaign.skippedCount || 0
      );
    });

    // ----------------------------------------
    // CALCULATE RATES
    // ----------------------------------------

    const deliveryRate =
      totalRecipients > 0
        ? Number(
            (
              (totalSent / totalRecipients) *
              100
            ).toFixed(2)
          )
        : 0;

    const failureRate =
      totalRecipients > 0
        ? Number(
            (
              (totalFailed / totalRecipients) *
              100
            ).toFixed(2)
          )
        : 0;

    const skipRate =
      totalRecipients > 0
        ? Number(
            (
              (totalSkipped / totalRecipients) *
              100
            ).toFixed(2)
          )
        : 0;

    // ----------------------------------------
    // RESPONSE
    // ----------------------------------------

    res.json({
      success: true,

      analytics: {
        totalCampaigns,
        sentCampaigns,
        draftCampaigns,
        failedCampaigns,
        sendingCampaigns,

        totalRecipients,
        totalSent,
        totalFailed,
        totalSkipped,

        deliveryRate,
        failureRate,
        skipRate
      }
    });

  } catch (error) {

    console.error(
      "Get overall analytics error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while getting overall campaign analytics"
    });
  }
};
// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaign,
  deleteCampaign,
  sendCampaign,
  getCampaignAnalytics,
  getOverallAnalytics
};