const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    subject: {
      type: String,
      required: true,
      trim: true
    },

    content: {
      type: String,
      required: true
    },

    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contact"
      }
    ],

    status: {
      type: String,
      enum: ["draft", "sending", "sent", "failed"],
      default: "draft"
    },

    totalRecipients: {
      type: Number,
      default: 0
    },

    sentCount: {
      type: Number,
      default: 0
    },

    failedCount: {
      type: Number,
      default: 0
    },

    skippedCount: {
      type: Number,
      default: 0
    },

    sentAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Campaign", campaignSchema);