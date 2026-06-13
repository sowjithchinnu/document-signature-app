import { useEffect, useState } from "react";
import API from "../services/api";
import PDFPreview from "../components/PDFPreview";

function Dashboard({ token, onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    if (token) {
      fetchDocuments();
    }
  }, [token]);

  const fetchDocuments = async () => {
    try {
      const res = await API.get("/docs");
      const docs = Array.isArray(res.data) ? res.data : [];

      // Enrich documents with latest signature status
      const enriched = await Promise.all(
        docs.map(async (doc) => {
          try {
            const sRes = await API.get(`/signatures/${doc._id}`);
            const signatures = Array.isArray(sRes.data)
              ? sRes.data
              : [];

            if (signatures.length === 0) {
              return { ...doc, latestStatus: null };
            }

            const latest = signatures
              .slice()
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

            console.log("Document", doc._id, "latest signature status:", latest.status, "(createdAt:", latest.createdAt, "updatedAt:", latest.updatedAt, ")");

            return { ...doc, latestStatus: latest.status || null };
          } catch (err) {
            // On error, return document without status
            return { ...doc, latestStatus: null };
          }
        })
      );

      setDocuments(enriched);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage("Please choose a PDF file before uploading.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("pdf", selectedFile);

      await API.post("/docs/upload", formData);
      setSelectedFile(null);
      setUploadMessage("Upload successful. Refreshing documents...");
      fetchDocuments();
    } catch (error) {
      console.error(error);
      setUploadMessage("Upload failed. Please try again.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <label style={{ fontWeight: 600 }}>Filter by status:</label>
        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option>All</option>
          <option>Pending</option>
          <option>Signed</option>
          <option>Rejected</option>
        </select>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>My Documents</h1>
        <button onClick={onLogout}>Logout</button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />
        <button onClick={handleUpload} style={{ marginLeft: "10px" }}>
          Upload PDF
        </button>
        {uploadMessage && <p>{uploadMessage}</p>}
      </div>

      {documents.length === 0 ? (
        <p>No documents yet. Upload a PDF to get started.</p>
      ) : (
        // Apply status filter. If 'All' show every document. Otherwise show documents
        // whose latest signature status matches the selected status (case-insensitive).
        documents
          .filter((doc) => {
            if (selectedStatus === "All") return true;
            const status = doc.latestStatus || "";
            return status.toLowerCase() === selectedStatus.toLowerCase();
          })
          .map((doc) => (
            <div
              key={doc._id}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "20px",
              }}
            >
              <h3>{doc.filename}</h3>

              <PDFPreview
                fileUrl={`http://localhost:3001/${doc.filepath}`}
                documentId={doc._id}
              />
            </div>
          ))
      )}
    </div>
  );
}

export default Dashboard;