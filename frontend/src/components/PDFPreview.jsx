import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import API from "../services/api";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import SignaturePad from "./SignaturePad";
import { toPng } from "html-to-image";


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
  fileHttpHeaders,
}) {
  const [signatureData, setSignatureData] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [dragPos, setDragPos] = useState({ x: 50, y: 50 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pageDimensions, setPageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [canvasOffset, setCanvasOffset] = useState({ left: 0, top: 0 });
  const typedSignatureRef = useRef(null);
  const [signatureType, setSignatureType] = useState("drawn");
  const [typedSignature, setTypedSignature] = useState("");

  const containerRef = useRef(null);
  const placeholderRef = useRef(null);
  const currentPageRef = useRef(currentPage);

  const authHeader = fileHttpHeaders?.Authorization;

  const pdfFile = useMemo(() => {
    if (authHeader) {
      return { url: fileUrl, httpHeaders: { Authorization: authHeader } };
    }
    return fileUrl;
  }, [fileUrl, authHeader]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    setPdfError("");
  }, [fileUrl]);

  const getPageCanvas = useCallback(() => {
    return containerRef.current?.querySelector(".react-pdf__Page__canvas") ?? null;
  }, []);

  const syncCanvasMetrics = useCallback(() => {
    const canvas = getPageCanvas();
    const container = containerRef.current;

    if (!canvas || !container) {
      return null;
    }

    const containerRect = container.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const metrics = {
      left: canvasRect.left - containerRect.left,
      top: canvasRect.top - containerRect.top,
      width: canvasRect.width,
      height: canvasRect.height,
    };

    setCanvasOffset((prev) =>
      prev.left === metrics.left && prev.top === metrics.top ? prev : metrics
    );

    setPageDimensions((prev) =>
      prev.width === metrics.width && prev.height === metrics.height
        ? prev
        : { width: metrics.width, height: metrics.height }
    );

    return metrics;
  }, [getPageCanvas]);

  useEffect(() => {
    setDragPos({ x: 50, y: 50 });
    setPageDimensions({ width: 0, height: 0 });
    setCanvasOffset({ left: 0, top: 0 });
  }, [currentPage]);

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
        const page = Number(latestSignature.page);

        if (!Number.isNaN(page) && page > 0) {
          setCurrentPage(page);
        }

        if (!Number.isNaN(x) && !Number.isNaN(y)) {
          setDragPos((prev) =>
            prev.x === x && prev.y === y ? prev : { x, y }
          );
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

      const canvas = getPageCanvas();
      const placeholder = placeholderRef.current;

      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const placeholderRect = placeholder?.getBoundingClientRect();

      const maxX = Math.max(0, rect.width - (placeholderRect?.width ?? 0));
      const maxY = Math.max(0, rect.height - (placeholderRect?.height ?? 0));

      const x = Math.round(event.clientX - rect.left - dragOffset.x);
      const y = Math.round(event.clientY - rect.top - dragOffset.y);

      const nextX = clamp(x, 0, maxX);
      const nextY = clamp(y, 0, maxY);

      setDragPos((prev) =>
        prev.x === nextX && prev.y === nextY ? prev : { x: nextX, y: nextY }
      );
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
  }, [isDragging, dragOffset, getPageCanvas]);

  const handleMouseDown = useCallback(
    (event) => {
      const canvas = getPageCanvas();

      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      setDragOffset({
        x: event.clientX - rect.left - dragPos.x,
        y: event.clientY - rect.top - dragPos.y,
      });

      setIsDragging(true);
    },
    [dragPos.x, dragPos.y, getPageCanvas]
  );

  const handlePointerDown = useCallback((event) => {
  const container = containerRef.current;

  if (!container) return;

  const rect = container.getBoundingClientRect();

  setDragOffset({
    x: event.clientX - rect.left - dragPos.x,
    y: event.clientY - rect.top - dragPos.y,
  });

  setIsDragging(true);
}, [dragPos.x, dragPos.y]);

  const handleDocumentLoadSuccess = useCallback(({ numPages: totalPages }) => {
    setNumPages(totalPages);
  }, []);

  const handlePageLoadSuccess = useCallback(
    (page) => {
      if (page.pageNumber !== currentPageRef.current) {
        return;
      }

      const viewport = page.getViewport({
        scale: previewWidth / page.originalWidth,
      });

      setPageDimensions((prev) => {
        if (
          prev.width === viewport.width &&
          prev.height === viewport.height
        ) {
          return prev;
        }
        return {
          width: viewport.width,
          height: viewport.height,
        };
      });

      requestAnimationFrame(() => {
        syncCanvasMetrics();
      });
    },
    [previewWidth, syncCanvasMetrics]
  );

  const handleDocumentLoadError = useCallback((error) => {
    console.error("PDF preview failed to load:", error);
    setPdfError(
      "PDF file not found on the server. Delete this document and upload it again."
    );
  }, []);

  const handleSignaturePadSave = useCallback((data) => {
    setSignatureData(data);
  }, []);

  const saveSignature = useCallback(async () => {
  const hasDrawnSignature =
    signatureType === "drawn" && signatureData;

  const hasTypedSignature =
    signatureType === "typed" &&
    typedSignature?.trim();

  if (!hasDrawnSignature && !hasTypedSignature) {
    alert("Please provide a signature first.");
    return;
  }

  let finalSignatureData = signatureData;

  // Convert typed signature preview into PNG
  if (
    signatureType === "typed" &&
    typedSignatureRef.current
  ) {
    try {
      finalSignatureData = await toPng(
        typedSignatureRef.current,
        {
          cacheBust: true,
          backgroundColor: "white",
        }
      );
    } catch (error) {
      console.error(
        "Failed to convert typed signature to PNG:",
        error
      );

      alert("Unable to generate typed signature image.");
      return;
    }
  }

  const metrics = syncCanvasMetrics();

  const renderedWidth =
    metrics?.width ?? pageDimensions.width;

  const renderedHeight =
    metrics?.height ?? pageDimensions.height;

  if (!renderedWidth || !renderedHeight) {
    alert(
      "PDF page is still loading. Please wait and try again."
    );
    return;
  }

  const xPct = dragPos.x / renderedWidth;
  const yPct = dragPos.y / renderedHeight;

  const payload = {
    documentId,

    x: canvasOffset.left + dragPos.x,
    y: canvasOffset.top + dragPos.y,

    page: currentPage,

    renderedWidth,
    renderedHeight,

    xPct,
    yPct,

    signatureType,

    signatureText: typedSignature,

    // IMPORTANT:
    // drawn -> original canvas PNG
    // typed -> generated PNG from html-to-image
    signatureData: finalSignatureData,
  };

  try {
    await API.post("/api/signatures", payload);

    alert("Signature position saved!");
  } catch (error) {
    console.error(error);

    alert("Unable to save signature position.");
  }
}, [
  documentId,
  dragPos,
  pageDimensions,
  signatureData,
  typedSignature,
  signatureType,
  currentPage,
  canvasOffset,
  syncCanvasMetrics,
]);

  const generateSignedPDF = useCallback(async () => {
    try {
      const res = await API.get(`/api/pdf/generate/${documentId}`);

      const downloadUrl = res.data?.downloadUrl;

      if (!downloadUrl) {
        throw new Error("No download URL returned from generate endpoint");
      }

      const fullUrl = downloadUrl.startsWith("http")
        ? downloadUrl
        : `${import.meta.env.VITE_API_URL}${downloadUrl}`;

      window.open(fullUrl, "_blank");
    } catch (error) {
      console.error("Failed to generate signed PDF:", error);
      alert("Unable to generate signed PDF.");
    }
  }, [documentId]);

  useEffect(() => {
    if (actionsRef) {
      actionsRef.current = { saveSignature, generateSignedPDF };
    }
  }, [actionsRef, saveSignature, generateSignedPDF]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "10px",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
        >
          Previous
        </button>

        <span>
          Page {currentPage} of {numPages}
        </span>

        <button
          type="button"
          onClick={() =>
            setCurrentPage((p) => Math.min(numPages || p, p + 1))
          }
          disabled={currentPage >= numPages}
        >
          Next
        </button>
      </div>

      <div
        ref={containerRef}
        style={{
          position: "relative",
          display: "inline-block",
        }}
      >
        <Document
          file={pdfFile}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
        >
          <Page
            pageNumber={currentPage}
            width={previewWidth}
            onLoadSuccess={handlePageLoadSuccess}
            onRenderSuccess={syncCanvasMetrics}
          />
        </Document>

        {pdfError && (
          <p
            style={{
              color: "#b91c1c",
              fontSize: 12,
              marginTop: 8,
              maxWidth: previewWidth,
            }}
          >
            {pdfError}
          </p>
        )}

        <div
          id="signature-placeholder"
          ref={placeholderRef}
          onPointerDown={handlePointerDown}
          style={{
            position: "absolute",
            left: `${canvasOffset.left + dragPos.x}px`,
            top: `${canvasOffset.top + dragPos.y}px`,
            backgroundColor: "yellow",
            padding: "2px 2px",
            border: "1px solid #333",
            fontWeight: "bold",
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
            zIndex: 10,
            touchAction: "none",
          }}
        >
          SIGN HERE
        </div>
      </div>

      <div style={{ marginTop: 16, width: previewWidth }}>
  <select
    value={signatureType}
    onChange={(e) => setSignatureType(e.target.value)}
    style={{ marginBottom: "10px", width: "100%" }}
  >
    <option value="drawn">Draw Signature</option>
    <option value="typed">Type Signature</option>
  </select>

  {signatureType === "drawn" ? (
    <SignaturePad
      width={previewWidth}
      onSave={handleSignaturePadSave}
    />
  ) : (
    <div>
  <input
    type="text"
    value={typedSignature}
    onChange={(e) => setTypedSignature(e.target.value)}
    placeholder="Type your signature"
    style={{
      width: "100%",
      padding: "10px",
      marginBottom: "10px",
    }}
  />

  <div className="mt-4 text-xl font-medium">
    {typedSignature}
  </div>
</div>
  )}
</div>

      {!hideActions && (
        <div style={{ marginTop: 8, display: "flex", gap: "10px" }}>
          <button type="button" onClick={saveSignature}>
            Save Signature Position
          </button>
          <button type="button" onClick={generateSignedPDF}>
            Generate Signed PDF
          </button>
        </div>
      )}

      {hideActions && (
        <div style={{ display: "none" }}>
          <button id={saveButtonId} type="button" onClick={saveSignature} />
          <button
            id={generateButtonId}
            type="button"
            onClick={generateSignedPDF}
          />
        </div>
      )}
    </div>
  );
}

export default PDFPreview;
