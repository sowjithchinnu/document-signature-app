const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const {
  uploadDocument,
  getDocuments,
  deleteDocument,
} = require("../controllers/documentController");

const protect = require("../middleware/authMiddleware");

const uploadDirectory = path.join(__dirname, "../..", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadDirectory, { recursive: true });
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post(
  "/upload",
  protect,
  upload.single("pdf"),
  uploadDocument
);

router.get(
  "/",
  protect,
  getDocuments
);

router.delete(
  "/:documentId",
  protect,
  deleteDocument
);

module.exports = router;