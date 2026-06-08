import api from "./client";
export const getDashboard = () => api.get("/analytics/dashboard").then((r) => r.data);
export const getTryOnSessions = () => api.get("/tryon/all").then((r) => r.data);
