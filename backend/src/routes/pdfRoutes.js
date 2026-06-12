const express = require("express");

const router = express.Router();

const protect = require(
  "../middleware/authMiddleware"
);

const {
  generateSignedPDF,
} = require(
  "../controllers/pdfController"
);

router.get(
  "/generate/:documentId",
  protect,
  generateSignedPDF
);

module.exports = router;