import React, { useRef } from "react";
import PDFPreview from "./PDFPreview";
import StatusBadge from "./StatusBadge";

function DocumentCard({ doc, onDelete }) {
  const previewActionsRef = useRef(null);
  console.log(doc.filepath);
  const statusBadge = <StatusBadge status={doc.latestStatus || "Pending"} />;

  return (
    <div className="bg-white rounded-xl shadow-md p-8 flex flex-col md:flex-row gap-8 w-full">
      <div className="w-full md:w-[220px] flex-shrink-0">
        <PDFPreview
          fileUrl={`${import.meta.env.VITE_API_URL}/${doc.filepath}`}
          documentId={doc._id}
          previewWidth={220}
          hideActions
          saveButtonId={`save-signature-${doc._id}`}
          generateButtonId={`generate-pdf-${doc._id}`}
          actionsRef={previewActionsRef}
        />
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
              console.log("[DocumentCard] Save Signature Position clicked", {
                documentId: doc._id,
                hasActionsRef: !!previewActionsRef.current,
                hasSaveHandler: !!previewActionsRef.current?.saveSignature,
              });

              if (!previewActionsRef.current?.saveSignature) {
                console.error(
                  "[DocumentCard] saveSignature handler missing — request never started"
                );
                return;
              }

              previewActionsRef.current.saveSignature();
            }}
          >
            Save Signature Position
          </button>

          <button
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg transition"
            type="button"
            onClick={() => {
              console.log("[DocumentCard] Generate Signed PDF clicked", {
                documentId: doc._id,
                hasGenerateHandler: !!previewActionsRef.current?.generateSignedPDF,
              });
              previewActionsRef.current?.generateSignedPDF?.();
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
