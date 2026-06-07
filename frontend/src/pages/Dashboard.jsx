import { useEffect, useState } from "react";
import API from "../services/api";
import PDFPreview from "../components/PDFPreview";

function Dashboard() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await API.get("/docs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDocuments(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>My Documents</h1>

      {documents.map((doc) => (
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
      ))}
    </div>
  );
}

export default Dashboard;