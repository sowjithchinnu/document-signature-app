import React from "react";
import PDFPreview from "./PDFPreview";
import StatusBadge from "./StatusBadge";

function DocumentCard({ doc, onDelete }) {
  console.log(doc.filepath);
  const statusBadge = <StatusBadge status={doc.latestStatus || "Pending"} />;

  return (
    <div className="bg-white rounded-xl shadow-md p-8 flex flex-col md:flex-row gap-8 w-full">
      <div className="w-full md:w-[220px] flex-shrink-0">
        <div className="w-[220px] h-[300px] rounded-lg border overflow-hidden">
          <PDFPreview
            fileUrl={`${import.meta.env.VITE_API_URL}/${doc.filepath}`}
            documentId={doc._id}
            previewWidth={220}
            hideActions
            saveButtonId={`save-signature-${doc._id}`}
            generateButtonId={`generate-pdf-${doc._id}`}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-2 break-words">{doc.filename}</h3>

          <div className="mb-4">{statusBadge}</div>

          <p className="text-gray-500 text-sm">
            Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-3">
          <button
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg transition"
            type="button"
            onClick={() => {
              document.getElementById(`save-signature-${doc._id}`)?.click();
            }}
          >
            Save Signature Position
          </button>

          <button
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg transition"
            type="button"
            onClick={() => {
              document.getElementById(`generate-pdf-${doc._id}`)?.click();
            }}
          >
            Generate Signed PDF
          </button>
          <button
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg transition"
            type="button"
            onClick={() => onDelete(doc._id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentCard;
