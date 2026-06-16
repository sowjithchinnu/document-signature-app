const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const protect = require("./middleware/authMiddleware");
const documentRoutes = require("./routes/documentRoutes");
const cors = require("cors");
const signatureRoutes = require("./routes/signatureRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const auditRoutes = require("./routes/auditRoutes");

dotenv.config();

connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://document-signature-app-sigma.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy: Origin not allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));
app.options(/^.*$/, cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/audit", auditRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/docs", documentRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/signatures", signatureRoutes);
app.use("/api/pdf", pdfRoutes);
app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

app.get("/", (req, res) => {
  res.send("Document Signature API Running");
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});