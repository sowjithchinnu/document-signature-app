const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  saveSignature,
  getSignaturesByDocument,
  generatePublicLink
} = require("../controllers/signatureController");

router.post("/", protect, saveSignature);
router.get("/:documentId", protect, getSignaturesByDocument);
router.post(
  "/share/:documentId",
  protect,
  generatePublicLink
);
module.exports = router;