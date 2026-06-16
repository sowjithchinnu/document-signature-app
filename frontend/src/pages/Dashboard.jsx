import { useEffect, useState } from "react";
import API from "../services/api";
import DocumentCard from "../components/DocumentCard";

function Dashboard({ token, onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (token) {
      fetchDocuments();
    }
  }, [token]);

  const fetchDocuments = async () => {
    try {
      const res = await API.get("/api/docs");
      const docs = Array.isArray(res.data) ? res.data : [];

      // Enrich documents with latest signature status
      const enriched = await Promise.all(
        docs.map(async (doc) => {
          try {
            const sRes = await API.get(`/api/signatures/${doc._id}`);
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

      const sorted = enriched.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setDocuments(sorted);
      setStatusMessage("");
    } catch (error) {
      console.error(error);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (selectedStatus === "All") return true;
    const status = doc.latestStatus || "";
    return status.toLowerCase() === selectedStatus.toLowerCase();
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage("Please choose a PDF file before uploading.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("pdf", selectedFile);

      await API.post("/api/docs/upload", formData);
      setSelectedFile(null);
      setUploadError(false);
      setUploadMessage("Upload successful. Refreshing documents...");
      await fetchDocuments();
    } catch (error) {
      console.error(error);
      setUploadError(true);
      setUploadMessage(
        error.response?.data?.message || "Upload failed. Please try again."
      );
    }
  };

  const handleDeleteDocument = async (documentId) => {
    const confirmed = window.confirm("Are you sure you want to delete this document? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await API.delete(`/api/documents/${documentId}`);
      setStatusMessage("Document deleted successfully.");
      fetchDocuments();
    } catch (error) {
      console.error(error);
      setStatusMessage(
        error.response?.data?.message || "Unable to delete document. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Documents</h1>
        <button
          onClick={onLogout}
          className="px-3 py-2 bg-white border rounded-md shadow-sm text-sm hover:bg-gray-100"
        >
          Logout
        </button>
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="bg-white shadow rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700">Upload PDF</label>
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700"
                />
                <button
                  onClick={handleUpload}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Upload PDF
                </button>
              </div>
              {uploadMessage && (
                <p
                  className={`mt-2 text-sm ${uploadError ? "text-red-600" : "text-green-600"}`}
                >
                  {uploadMessage}
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white shadow rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700">Filter by status</label>
              <div className="mt-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="block w-full rounded-md border-gray-200 bg-white py-2 px-3 text-sm"
                >
                  <option>All</option>
                  <option>Pending</option>
                  <option>Signed</option>
                  <option>Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {documents.length === 0 ? (
            <p className="text-center text-gray-500">No documents yet. Upload a PDF to get started.</p>
          ) : (
            filteredDocuments.map((doc) => (
              <DocumentCard key={doc._id} doc={doc} onDelete={handleDeleteDocument} />
            ))
          )}
        </section>

        {statusMessage && (
          <div className="bg-white rounded-xl shadow p-4 text-center text-sm text-gray-700">
            {statusMessage}
          </div>
        )}
        {filteredDocuments.length === 0 && documents.length > 0 && (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            No documents found for this status.
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;