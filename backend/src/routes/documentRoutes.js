const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
  uploadDocument,
  getDocuments,
} = require("../controllers/documentController");

const protect = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
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

module.exports = router;