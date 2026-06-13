const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb } = require("pdf-lib");
const createAuditLog = require("../utils/createAuditLog");
const Document = require("../models/Document");
const Signature = require("../models/Signature");

const generateSignedPDF = async (req, res) => {
  try {
    console.log("=== generateSignedPDF started ===");
    const { documentId } = req.params;

    // Diagnostic: confirm handler invocation and user presence
    console.log("generateSignedPDF called", {
      params: req.params,
      user: req.user || null,
    });

    // Find document
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    console.log("Document found:", document._id);

    // Find the latest signature for this document by update time,
    // so status changes are reflected immediately.
    const signature = await Signature.findOne({ documentId }).sort({ updatedAt: -1 });

    if (!signature) {
      return res.status(404).json({
        message: "No signatures found",
      });
    }

    console.log("Latest signature found:", signature._id.toString(), {
      status: signature.status,
      page: signature.page,
      x: signature.x,
      y: signature.y,
      xPct: signature.xPct,
      yPct: signature.yPct,
    });

    // Load original PDF
    const pdfPath = path.join(__dirname, "../../", document.filepath);

    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();

    const pageIndex = signature.page - 1;
    const page = pages[pageIndex];

    if (!page) {
      return res.status(400).json({
        message: `Page ${signature.page} not found in PDF`,
      });
    }

    const pdfWidth = page.getWidth();
    const pdfHeight = page.getHeight();

    // Use saved rendered dimensions from frontend (or fallback to defaults)
    const renderedWidth = signature.renderedWidth || 250;
    const renderedHeight = signature.renderedHeight || (pdfHeight / pdfWidth) * 250;

    const textHeightOffset = 12; // Approximate height for size 30 text

    // If the signature was stored using normalized coordinates, prefer those.
    const pdfX = typeof signature.xPct === "number"
      ? signature.xPct * pdfWidth
      : signature.x * (pdfWidth / renderedWidth);

    const pdfY = typeof signature.yPct === "number"
      ? pdfHeight - signature.yPct * pdfHeight - textHeightOffset
      : pdfHeight - (signature.y + textHeightOffset) * (pdfHeight / renderedHeight);

    const clampedPdfX = Math.max(0, Math.min(pdfX, pdfWidth - 10));
    const clampedPdfY = Math.max(0, Math.min(pdfY, pdfHeight - 10));

    console.log("=== Signature Positioning Debug ===");
    console.log("Saved signature dimensions:", {
      renderedWidth: signature.renderedWidth,
      renderedHeight: signature.renderedHeight,
      xPct: signature.xPct,
      yPct: signature.yPct,
    });
    console.log("Calculated rendered height:", renderedHeight);
    console.log("Preview coordinates:", { x: signature.x, y: signature.y });
    console.log("PDF dimensions:", { pdfWidth, pdfHeight });
    console.log("PDF coordinates:", { pdfX, pdfY, clampedPdfX, clampedPdfY });

    const status = signature.status || "Pending";
    if (status === "Rejected") {
      page.drawText("REJECTED", {
        x: clampedPdfX,
        y: clampedPdfY,
        size: 30,
        color: rgb(1, 0, 0),
      });
    } else {
      // Pending and Signed signatures should both render as a signed stamp.
      page.drawText("SIGNED", {
        x: clampedPdfX,
        y: clampedPdfY,
        size: 30,
        color: rgb(0, 0.6, 0),
      });
    }

    // Create signed folder if needed
    const signedDir = path.join(
      __dirname,
      "../../",
      "uploads",
      "signed"
    );

    if (!fs.existsSync(signedDir)) {
      fs.mkdirSync(signedDir, {
        recursive: true,
      });
    }

    // Save signed PDF
    console.log("Reached before pdfDoc.save()");
    const signedPdfBytes = await pdfDoc.save();
    const outputFilename = `signed-${document.filename}`;
    const outputPath = path.join(signedDir, outputFilename);

    fs.writeFileSync(outputPath, signedPdfBytes);
    console.log("Reached after writeFileSync()");
    console.log("PDF saved successfully");

    // Mark the signature as Signed in the database so dashboard reflects status
    try {
      console.log("Updating signature status to Signed for", signature._id.toString());
      signature.status = "Signed";
      await signature.save();
      console.log("Signature status updated:", signature._id.toString(), signature.status);
    } catch (err) {
      console.error("Failed to update signature status:", err);
    }

    console.log("About to create audit log", { documentId, userId: req.user && req.user.id, ip: req.ip });
    console.log("Attempting to create audit log");
    try {
      const auditResult = await createAuditLog({
        documentId,
        userId: req.user && req.user.id,
        action: "Generated signed PDF",
        ipAddress: req.ip,
      });

      console.log("Audit log created", { auditResult });
      console.log("Audit log created successfully");
    } catch (err) {
      console.error("createAuditLog threw an error:", err);
    }

    return res.status(200).json({
      message: "Signed PDF generated successfully",
      downloadUrl: `/uploads/signed/${outputFilename}`,
    });
  } catch (error) {
    console.error("generateSignedPDF error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  generateSignedPDF,
};