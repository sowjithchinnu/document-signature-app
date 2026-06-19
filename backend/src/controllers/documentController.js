const fs = require("fs");
const path = require("path");
const Document = require("../models/Document");
const Signature = require("../models/Signature");
const Audit = require("../models/Audit");
const createAuditLog = require("../utils/createAuditLog");

// Upload Document
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const storedFilepath = path.relative(path.join(__dirname, "../.."), req.file.path).replace(/\\/g, "/");

    const document = await Document.create({
      filename: req.file.originalname,
      filepath: storedFilepath,
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

// Delete Document
const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    if (document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You do not have permission to delete this document",
      });
    }

    // Delete associated signatures and audit logs
    await Signature.deleteMany({ documentId });
    await Audit.deleteMany({ documentId });

    // Delete file assets
    const originalFile = path.join(__dirname, "../../", document.filepath);
    if (fs.existsSync(originalFile)) {
      fs.unlinkSync(originalFile);
    }

    const signedFile = path.join(
      __dirname,
      "../../",
      "uploads",
      "signed",
      `signed-${document.filename}`
    );

    if (fs.existsSync(signedFile)) {
      fs.unlinkSync(signedFile);
    }

    await document.deleteOne();

    return res.status(200).json({
      message: "Document deleted successfully",
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

const serveDocumentFile = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    if (document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You do not have permission to access this document",
      });
    }

    const filePath = path.resolve(
      path.join(__dirname, "../../", document.filepath)
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message:
          "PDF file not found on server. It may have been lost after a deploy or restart. Please delete this document and upload it again.",
        filepath: document.filepath,
      });
    }

    return res.sendFile(filePath, {
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  deleteDocument,
  serveDocumentFile,
};