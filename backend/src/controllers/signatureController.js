const jwt = require("jsonwebtoken");
const Signature = require("../models/Signature");

const saveSignature = async (req, res) => {
  try {
    const { documentId, x, y, page, xPct, yPct, renderedWidth, renderedHeight } = req.body;

    const createData = {
      documentId,
      signer: req.user.id,
      x,
      y,
      page,
    };

    // include rendered dimensions for accurate coordinate conversion
    if (typeof renderedWidth === "number") createData.renderedWidth = renderedWidth;
    if (typeof renderedHeight === "number") createData.renderedHeight = renderedHeight;

    // include normalized coords when provided
    if (typeof xPct === "number") createData.xPct = xPct;
    if (typeof yPct === "number") createData.yPct = yPct;

    const signature = await Signature.create(createData);

    res.status(201).json(signature);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

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
const generatePublicLink = async (req, res) => {
  try {
    const { documentId } = req.params;

    const token = jwt.sign(
      { documentId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const publicUrl = `http://localhost:5173/sign/${token}`;

    res.status(200).json({
      message: "Public signature link generated",
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
};