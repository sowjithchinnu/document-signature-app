const mongoose = require("mongoose");

const signatureSchema = new mongoose.Schema(
  {
    token: {
  type: String,
},
    expiresAt: {
  type: Date,
},

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    signer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    x: {
      type: Number,
      required: true,
    },

    y: {
      type: Number,
      required: true,
    },
    
    renderedWidth: {
  type: Number,
},

renderedHeight: {
  type: Number,
},
    // Normalized coordinates (0..1) to support responsive rendering
    xPct: {
      type: Number,
    },

    yPct: {
      type: Number,
    },

    page: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      enum: ["Pending", "Signed", "Rejected"],
      default: "Pending",
    },

    rejectionReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Signature", signatureSchema);