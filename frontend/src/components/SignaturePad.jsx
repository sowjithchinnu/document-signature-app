import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

function SignaturePad({ onSave, width = 400, height = 150 }) {
  const sigCanvas = useRef(null);

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const saveSignature = () => {
    console.log("[SignaturePad] Save Signature clicked");

    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      console.log("[SignaturePad] Canvas empty — aborting, onSave not called");
      alert("Please draw a signature first.");
      return;
    }

    const dataUrl = sigCanvas.current.toDataURL("image/png");
    console.log("[SignaturePad] Calling onSave with PNG data URL", {
      length: dataUrl.length,
      prefix: dataUrl.slice(0, 40),
    });
    onSave(dataUrl);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          border: "2px solid #333",
          borderRadius: 8,
          overflow: "hidden",
          backgroundColor: "#fff",
          width,
        }}
      >
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            width,
            height,
            className: "signature-canvas",
            style: {
              display: "block",
              width: "100%",
              height,
              touchAction: "none",
            },
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={clearSignature}
          style={{
            backgroundColor: "#6b7280",
            color: "#fff",
            padding: "8px 16px",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Clear
        </button>

        <button
          type="button"
          onClick={saveSignature}
          style={{
            backgroundColor: "#2563eb",
            color: "#fff",
            padding: "8px 16px",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Save Signature
        </button>
      </div>
    </div>
  );
}

export default SignaturePad;