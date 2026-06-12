const Audit = require("../models/Audit");

const createAuditLog = async ({
  documentId,
  userId,
  action,
  ipAddress,
}) => {
  try {
    const created = await Audit.create({
      documentId,
      userId,
      action,
      ipAddress,
    });

    return created;
  } catch (error) {
    // Log full error for troubleshooting and rethrow so callers can react if desired
    console.error("Audit log failed:", error);
    throw error;
  }
};

module.exports = createAuditLog;