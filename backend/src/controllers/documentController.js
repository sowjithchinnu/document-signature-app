const Document = require("../models/Document");
const createAuditLog = require("../utils/createAuditLog");
// Upload Document
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const document = await Document.create({
      filename: req.file.originalname,
      filepath: req.file.path,
      uploadedBy: req.user.id,
    });

    await createAuditLog({
  documentId: document._id,
  userId: req.user.id,
  action: "Uploaded document",
  ipAddress: req.ip,
});

    res.status(201).json({
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get User Documents
const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      uploadedBy: req.user.id,
    });

    res.json(documents);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
};