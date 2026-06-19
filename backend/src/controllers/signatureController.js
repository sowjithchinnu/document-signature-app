const Signature = require("../models/Signature");
const Document = require("../models/Document");
const jwt = require("jsonwebtoken");
const createAuditLog = require("../utils/createAuditLog");
// Save signature position
const saveSignature = async (req, res) => {
  try {
    console.log("REQ BODY", req.body);
    console.log("REQ BODY keys", Object.keys(req.body || {}));
    console.log("REQ BODY signature fields", {
      signatureType: req.body?.signatureType,
      hasSignatureData: !!req.body?.signatureData,
      signatureDataLength: req.body?.signatureData?.length ?? 0,
    });

    const {
      documentId,
      x,
      y,
      page,
      xPct,
      yPct,
      renderedWidth,
      renderedHeight,
      signatureType,
      signatureData,
    } = req.body;

    const createData = {
      documentId,
      signer: req.user.id,
      x,
      y,
      page,
      signatureType,
      signatureData,
    };

    // Store rendered dimensions
    if (typeof renderedWidth === "number") {
      createData.renderedWidth = renderedWidth;
    }

    if (typeof renderedHeight === "number") {
      createData.renderedHeight = renderedHeight;
    }

    // Store normalized coordinates; compute them if the frontend did not.
    if (typeof xPct === "number") {
      createData.xPct = xPct;
    }

    if (typeof yPct === "number") {
      createData.yPct = yPct;
    }

    if (
      typeof createData.renderedWidth === "number" &&
      createData.renderedWidth > 0
    ) {
      createData.xPct = createData.x / createData.renderedWidth;
    }

    if (
      typeof createData.renderedHeight === "number" &&
      createData.renderedHeight > 0
    ) {
      createData.yPct = createData.y / createData.renderedHeight;
    }
    console.log("=== CREATE DATA ===");
    console.log({
      signatureType: createData.signatureType,
      hasSignatureData: !!createData.signatureData,
      dataLength: createData.signatureData?.length,
      x: createData.x,
      xPct: createData.xPct,
      renderedWidth: createData.renderedWidth,
    });

    const signature = await Signature.create(createData);

    console.log("=== SAVED DOC ===");
    console.log({
      id: signature._id,
      signatureType: signature.signatureType,
      hasSignatureData: !!signature.signatureData,
      dataLength: signature.signatureData?.length,
    });

    const test = await Signature.findOne({ _id: signature._id });
    console.log("=== MONGODB VERIFY ===");
    console.log({
      id: test?._id,
      signatureType: test?.signatureType,
      hasSignatureData: !!test?.signatureData,
      dataLength: test?.signatureData?.length,
    });

    await createAuditLog({
  documentId,
  userId: req.user.id,
  action: "Saved signature position",
  ipAddress: req.ip,
});

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

const updateSignatureStatus = async (req, res) => {
  try {
    const { signatureId } = req.params;
    const { status, rejectionReason } = req.body;

    console.log("updateSignatureStatus called", { signatureId, status, rejectionReason });

    if (!["Signed", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const signature = await Signature.findById(signatureId);

    if (!signature) {
      return res.status(404).json({
        message: "Signature not found",
      });
    }

    signature.status = status;

    if (status === "Rejected") {
      signature.rejectionReason =
        rejectionReason || "No reason provided";
    } else {
      signature.rejectionReason = "";
    }

    await signature.save();

    console.log("signature saved with new status", signature._id.toString(), signature.status);

    return res.status(200).json({
      message: `Signature ${status.toLowerCase()} successfully`,
      signature,
    });
  } catch (error) {
    return res.status(500).json({
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
  updateSignatureStatus,
};