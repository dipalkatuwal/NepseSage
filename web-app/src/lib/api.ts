import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000, // 30 s — NEPSE API can be slow on first symbol fetch
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("nepsesage_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const hadToken = !!localStorage.getItem("nepsesage_token");
      localStorage.removeItem("nepsesage_token");
      localStorage.removeItem("nepsesage_auth");
      if (hadToken) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;