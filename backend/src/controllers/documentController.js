const Document = require("../models/Document");

const uploadDocument = async (req, res) => {
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const document = await Document.create({
      filename: req.file.originalname,
      filepath: req.file.path,
      uploadedBy: req.user.id,
    });

    res.status(201).json({
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  uploadDocument,
};