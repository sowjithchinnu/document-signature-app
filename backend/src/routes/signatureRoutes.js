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

router.post("/", (req, res, next) => {
  console.log("[signatureRoutes] POST /api/signatures received", {
    hasBody: !!req.body,
    documentId: req.body?.documentId,
    signatureType: req.body?.signatureType,
    hasSignatureData: !!req.body?.signatureData,
    signatureDataLength: req.body?.signatureData?.length ?? 0,
  });
  next();
}, protect, saveSignature);

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