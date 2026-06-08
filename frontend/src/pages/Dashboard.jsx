import { useEffect, useState } from "react";
import API from "../services/api";
import PDFPreview from "../components/PDFPreview";

function Dashboard({ token, onLogout }) {
  const [documents, setDocuments] = useState([]);
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
      setDocuments(res.data);
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
        documents.map((doc) => (
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