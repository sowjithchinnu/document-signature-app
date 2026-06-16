import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";

function PublicSign() {
  const { token } = useParams();

  const [document, setDocument] = useState(null);

  useEffect(() => {
    fetchDocument();
  }, []);

  const fetchDocument = async () => {
    try {
      const res = await API.get(
        `/api/signatures/public/${token}`
      );

      setDocument(res.data);
    } catch (error) {
      console.error(error);

      alert("Invalid link");
    }
  };

  return (
    <div>
      <h1>Guest Signature Page</h1>

      {document ? (
        <>
          <p>{document.filename}</p>

          <iframe
            src={`${import.meta.env.VITE_API_URL}/${document.filepath}`}
            width="600"
            height="800"
          />
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default PublicSign;