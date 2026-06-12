const Signature = require("../models/Signature");
const Document = require("../models/Document");
const jwt = require("jsonwebtoken");

// Save signature position
const saveSignature = async (req, res) => {
  try {
    const {
      documentId,
      x,
      y,
      page,
      xPct,
      yPct,
      renderedWidth,
      renderedHeight,
    } = req.body;

    const createData = {
      documentId,
      signer: req.user.id,
      x,
      y,
      page,
    };

    // Store rendered dimensions
    if (typeof renderedWidth === "number") {
      createData.renderedWidth = renderedWidth;
    }

    if (typeof renderedHeight === "number") {
      createData.renderedHeight = renderedHeight;
    }

    // Store normalized coordinates
    if (typeof xPct === "number") {
      createData.xPct = xPct;
    }

    if (typeof yPct === "number") {
      createData.yPct = yPct;
    }

    const signature = await Signature.create(createData);

    res.status(201).json(signature);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get signatures for a document
const getSignaturesByDocument = async (req, res) => {
  try {
    const signatures = await Signature.find({
      documentId: req.params.documentId,
    });

    res.status(200).json(signatures);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Generate public signing link
const generatePublicLink = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const token = jwt.sign(
      {
        documentId,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Public signature link generated",
      publicUrl: `http://localhost:5174/sign/${token}`,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get document using public token
const getPublicDocument = async (req, res) => {
  try {
    const { token } = req.params;

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const document = await Document.findById(
      decoded.documentId
    );

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    res.status(200).json({
      documentId: document._id,
      filename: document.filename,
      filepath: document.filepath,
    });
  } catch (error) {
    res.status(401).json({
      message: "Invalid or expired link",
    });
  }
};
const sendSignatureEmail = async (req, res) => {
  try {
    const { email, publicUrl } = req.body;

    console.log("\n========== MOCK EMAIL ==========");
    console.log(`To: ${email}`);
    console.log("Subject: Document Signature Request");
    console.log(
      `Body: Please sign the document using this link:\n${publicUrl}`
    );
    console.log("================================\n");

    res.status(200).json({
      message: "Mock email sent successfully",
      recipient: email,
      publicUrl,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  saveSignature,
  getSignaturesByDocument,
  generatePublicLink,
  getPublicDocument,
  sendSignatureEmail,
};