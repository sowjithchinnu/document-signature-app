import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import API from "../services/api";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function PDFPreview({ fileUrl, documentId }) {
  const [signatures, setSignatures] = useState([]);

  useEffect(() => {
  fetchSignatures();
}, [documentId]);

  const fetchSignatures = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await API.get(`/signatures/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSignatures(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <Document file={fileUrl}>
        <Page pageNumber={1} width={250} />
      </Document>

      {signatures.map((sig) => (
        <div
          key={sig._id}
          style={{
            position: "absolute",
            left: `${sig.x}px`,
            top: `${sig.y}px`,
            backgroundColor: "yellow",
            padding: "4px",
            border: "1px solid black",
            fontSize: "12px",
          }}
        >
          SIGN HERE
        </div>
      ))}
    </div>
  );
}

export default PDFPreview;