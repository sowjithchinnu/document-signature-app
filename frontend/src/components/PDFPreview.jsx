import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import API from "../services/api";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function PDFPreview({ fileUrl, documentId }) {
  const [dragPos, setDragPos] = useState({ x: 100, y: 100 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const placeholderRef = useRef(null);

  useEffect(() => {
    const fetchLatestSignature = async () => {
      if (!documentId) return;

      try {
        const res = await API.get(`/signatures/${documentId}`);

        const signatures = Array.isArray(res.data) ? res.data : [];
        if (signatures.length === 0) return;

        const latestSignature = signatures
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

        const x = Number(latestSignature.x);
        const y = Number(latestSignature.y);

        if (!Number.isNaN(x) && !Number.isNaN(y)) {
          setDragPos({ x, y });
        }
      } catch (error) {
        console.error("Failed to fetch latest signature:", error);
      }
    };

    fetchLatestSignature();
  }, [documentId]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!isDragging) return;
      const container = containerRef.current;
      const placeholder = placeholderRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const placeholderRect = placeholder?.getBoundingClientRect();
      const maxX = Math.max(0, rect.width - (placeholderRect?.width ?? 0));
      const maxY = Math.max(0, rect.height - (placeholderRect?.height ?? 0));

      const x = Math.round(event.clientX - rect.left - dragOffset.x);
      const y = Math.round(event.clientY - rect.top - dragOffset.y);

      setDragPos({
        x: clamp(x, 0, maxX),
        y: clamp(y, 0, maxY),
      });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (event) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - dragPos.x;
    const offsetY = event.clientY - rect.top - dragPos.y;

    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
  };

  const saveSignature = async () => {
    try {
      await API.post("/signatures", {
        documentId,
        x: dragPos.x,
        y: dragPos.y,
        page: 1,
      });
      alert("Signature position saved!");
    } catch (error) {
      console.error("Failed to save signature:", error);
      alert("Unable to save signature position.");
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", display: "inline-block" }}
      onMouseLeave={() => isDragging && setIsDragging(false)}
    >
      <Document file={fileUrl}>
        <Page pageNumber={1} width={250} />
      </Document>

      <div
        id="signature-placeholder"
        ref={placeholderRef}
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          left: `${dragPos.x}px`,
          top: `${dragPos.y}px`,
          backgroundColor: "yellow",
          padding: "8px 10px",
          border: "1px solid #333",
          fontWeight: "bold",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          zIndex: 10,
        }}
      >
        SIGN HERE
      </div>

      <div style={{ marginTop: 8 }}>
        <button onClick={saveSignature}>Save Signature Position</button>
      </div>
    </div>
  );
}

export default PDFPreview;
