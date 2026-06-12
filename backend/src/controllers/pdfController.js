const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb } = require("pdf-lib");

const Document = require("../models/Document");
const Signature = require("../models/Signature");

const generateSignedPDF = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Find document
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    // Find signatures and get ONLY the latest one
    const signatures = await Signature.find({
      documentId,
    }).sort({ createdAt: -1 }).limit(1);

    if (signatures.length === 0) {
      return res.status(404).json({
        message: "No signatures found",
      });
    }

    const signature = signatures[0];

    // Load original PDF
    const pdfPath = path.join(
      __dirname,
      "../../",
      document.filepath
    );

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

    // Convert preview coordinates to PDF coordinates
    // X: scale horizontally
    const pdfX = signature.x * (pdfWidth / renderedWidth);

    // Y: flip and scale (PDF Y increases upward, preview Y increases downward)
    // Add text height offset (approximate) for better vertical alignment
    const textHeightOffset = 12; // Approximate height for size 30 text
    const pdfY = pdfHeight - (signature.y + textHeightOffset) * (pdfHeight / renderedHeight);

    console.log("=== Signature Positioning Debug ===");
    console.log("Saved signature dimensions:", { 
      renderedWidth: signature.renderedWidth, 
      renderedHeight: signature.renderedHeight 
    });
    console.log("Calculated rendered height:", renderedHeight);
    console.log("Preview coordinates (px):", { x: signature.x, y: signature.y });
    console.log("PDF dimensions:", { pdfWidth, pdfHeight });
    console.log("PDF coordinates (pt):", { pdfX, pdfY });

    page.drawText("SIGNED", {
      x: pdfX,
      y: pdfY,
      size: 30,
      color: rgb(0, 0.6, 0),
    });

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
    const signedPdfBytes = await pdfDoc.save();
    const outputFilename = `signed-${document.filename}`;
    const outputPath = path.join(signedDir, outputFilename);

    fs.writeFileSync(outputPath, signedPdfBytes);

    return res.status(200).json({
      message: "Signed PDF generated successfully",
      downloadUrl: `/uploads/signed/${outputFilename}`,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  generateSignedPDF,
};