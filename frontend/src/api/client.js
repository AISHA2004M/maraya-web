import axios from "axios";
import { useUserStore } from "../store/useUserStore";

const baseURL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? "https://vrital-api-1yxc.onrender.com" : "http://127.0.0.1:8000");

const api = axios.create({
  baseURL: `${baseURL.replace(/\/$/, "")}/api/v1`,
});

api.interceptors.request.use((config) => {
  const token = useUserStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useUserStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

export default api;
