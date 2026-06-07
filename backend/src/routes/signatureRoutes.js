const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  saveSignature,
  getSignaturesByDocument,
} = require("../controllers/signatureController");

router.post("/", protect, saveSignature);
router.get("/:documentId", protect, getSignaturesByDocument);

module.exports = router;