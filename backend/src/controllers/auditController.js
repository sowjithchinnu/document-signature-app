const Audit = require("../models/Audit");

const getAuditLogs = async (req, res) => {
  try {
    const audits = await Audit.find({
      documentId: req.params.fileId,
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(audits);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getAuditLogs,
};