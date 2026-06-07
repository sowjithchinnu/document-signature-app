import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function PDFPreview({ fileUrl }) {
  return (
    <Document file={fileUrl}>
      <Page pageNumber={1} width={250} />
    </Document>
  );
}

export default PDFPreview;