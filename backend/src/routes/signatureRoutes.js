const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  saveSignature,
  getSignaturesByDocument,
  generatePublicLink,
  getPublicDocument,
  sendSignatureEmail,
  updateSignatureStatus,
} = require("../controllers/signatureController");

router.post("/", protect, saveSignature);

router.get(
  "/:documentId",
  protect,
  getSignaturesByDocument
);

router.post(
  "/share/:documentId",
  protect,
  generatePublicLink
);

router.post(
  "/send-email",
  protect,
  sendSignatureEmail
);

router.get(
  "/public/:token",
  getPublicDocument
);

router.put(
  "/status/:signatureId",
  protect,
  updateSignatureStatus
);

module.exports = router;