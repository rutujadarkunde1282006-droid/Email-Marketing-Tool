const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
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

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    status: {
      type: String,
      enum: ["active", "unsubscribed"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

contactSchema.index({ userId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("Contact", contactSchema);