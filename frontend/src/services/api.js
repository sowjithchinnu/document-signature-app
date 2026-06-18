import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method === "post" && config.url === "/api/signatures") {
      const body = config.data ?? {};
      console.log("[API] Outgoing POST /api/signatures", {
        baseURL: config.baseURL,
        hasToken: !!token,
        documentId: body.documentId,
        signatureType: body.signatureType,
        hasSignatureData: !!body.signatureData,
        signatureDataLength: body.signatureData?.length ?? 0,
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => {
    if (response.config?.method === "post" && response.config?.url === "/api/signatures") {
      console.log("[API] POST /api/signatures response", response.status, {
        id: response.data?._id,
        signatureType: response.data?.signatureType,
        hasSignatureData: !!response.data?.signatureData,
      });
    }
    return response;
  },
  (error) => {
    if (error.config?.method === "post" && error.config?.url === "/api/signatures") {
      console.error("[API] POST /api/signatures error", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    return Promise.reject(error);
  }
);

export default API;