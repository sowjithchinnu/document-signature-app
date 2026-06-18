import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import API from "../services/api";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import SignaturePad from "./SignaturePad";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();


const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function PDFPreview({
  fileUrl,
  documentId,
  previewWidth = 250,
  hideActions = false,
  saveButtonId,
  generateButtonId,
  actionsRef,
}) {
  const [signatureData, setSignatureData] = useState("");
  const [dragPos, setDragPos] = useState({ x: 100, y: 100 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const [pageDimensions, setPageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const containerRef = useRef(null);
  const placeholderRef = useRef(null);

  useEffect(() => {
    const fetchLatestSignature = async () => {
      if (!documentId) return;

      try {
        const res = await API.get(`/api/signatures/${documentId}`);

        const signatures = Array.isArray(res.data) ? res.data : [];

        if (signatures.length === 0) return;

        const latestSignature = signatures
          .slice()
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

        const x = Number(latestSignature.x);
        const y = Number(latestSignature.y);

        if (!Number.isNaN(x) && !Number.isNaN(y)) {
          setDragPos({ x, y });
        }
      } catch (error) {
        console.error(
          "Failed to fetch latest signature:",
          error
        );
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
      const placeholderRect =
        placeholder?.getBoundingClientRect();

      const maxX = Math.max(
        0,
        rect.width - (placeholderRect?.width ?? 0)
      );

      const maxY = Math.max(
        0,
        rect.height - (placeholderRect?.height ?? 0)
      );

      const x = Math.round(
        event.clientX - rect.left - dragOffset.x
      );

      const y = Math.round(
        event.clientY - rect.top - dragOffset.y
      );

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

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      window.removeEventListener(
        "mouseup",
        handleMouseUp
      );
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (event) => {
    const container = containerRef.current;

    if (!container) return;

    const rect = container.getBoundingClientRect();

    const offsetX =
      event.clientX - rect.left - dragPos.x;

    const offsetY =
      event.clientY - rect.top - dragPos.y;

    setDragOffset({
      x: offsetX,
      y: offsetY,
    });

    setIsDragging(true);
  };

  const saveSignature = async () => {
    console.log("[PDFPreview] saveSignature() called", {
      documentId,
      hasSignatureData: !!signatureData,
      signatureDataLength: signatureData?.length ?? 0,
      dragPos,
      pageDimensions,
    });

    if (!signatureData) {
      console.warn(
        "[PDFPreview] Request aborted — signatureData is empty. " +
          "Draw on the canvas, then click SignaturePad's \"Save Signature\" before \"Save Signature Position\"."
      );
      alert("Please draw and save a signature first.");
      return;
    }

    const payload = {
      documentId,
      x: dragPos.x,
      y: dragPos.y,
      signatureType: "drawn",
      signatureData,
      page: 1,
      renderedWidth: pageDimensions.width,
      renderedHeight: pageDimensions.height,
      xPct: pageDimensions.width
        ? dragPos.x / pageDimensions.width
        : undefined,
      yPct: pageDimensions.height
        ? dragPos.y / pageDimensions.height
        : undefined,
    };

    console.log("[PDFPreview] Sending POST /api/signatures", {
      documentId: payload.documentId,
      signatureType: payload.signatureType,
      hasSignatureData: !!payload.signatureData,
      signatureDataLength: payload.signatureData?.length ?? 0,
      x: payload.x,
      y: payload.y,
    });

    try {
      const res = await API.post("/api/signatures", payload);
      console.log("[PDFPreview] POST /api/signatures succeeded", res.status, res.data);
      alert("Signature position saved!");
    } catch (error) {
      console.error("[PDFPreview] POST /api/signatures failed", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      alert(
        "Unable to save signature position."
      );
    }
  };

  const generateSignedPDF = async () => {
    try {
      const res = await API.get(
        `/api/pdf/generate/${documentId}`
      );

      const downloadUrl = res.data?.downloadUrl;

      if (!downloadUrl) {
        throw new Error(
          "No download URL returned from generate endpoint"
        );
      }

      const fullUrl = downloadUrl.startsWith("http")
        ? downloadUrl
        : `${import.meta.env.VITE_API_URL}${downloadUrl}`;

      window.open(fullUrl, "_blank");
    } catch (error) {
      console.error(
        "Failed to generate signed PDF:",
        error
      );
      alert("Unable to generate signed PDF.");
    }
  };
  if (actionsRef) {
    actionsRef.current = { saveSignature, generateSignedPDF };
  }

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          display: "inline-block",
        }}
      >
        <Document file={fileUrl}>
          <Page
            pageNumber={1}
            width={previewWidth}
            onLoadSuccess={(page) => {
              const viewport = page.getViewport({
                scale: previewWidth / page.originalWidth,
              });

              setPageDimensions({
                width: viewport.width,
                height: viewport.height,
              });
            }}
          />
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
            cursor: isDragging
              ? "grabbing"
              : "grab",
            userSelect: "none",
            zIndex: 10,
          }}
        >
          SIGN HERE
        </div>
      </div>

      <div style={{ marginTop: 16, width: previewWidth }}>
        <SignaturePad
          width={previewWidth}
          onSave={(data) => {
            console.log("[PDFPreview] SignaturePad onSave — storing signatureData in state", {
              length: data.length,
            });
            setSignatureData(data);
          }}
        />
      </div>

      {!hideActions && (
        <div style={{ marginTop: 8, display: "flex", gap: "10px" }}>
          <button onClick={saveSignature}>
            Save Signature Position
          </button>
          <button onClick={generateSignedPDF}>
            Generate Signed PDF
          </button>
        </div>
      )}

      {hideActions && (
        <div style={{ display: "none" }}>
          <button id={saveButtonId} type="button" onClick={saveSignature} />
          <button id={generateButtonId} type="button" onClick={generateSignedPDF} />
        </div>
      )}
    </div>
  );
}

export default PDFPreview;