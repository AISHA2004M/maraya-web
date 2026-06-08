import api from "./client";
export const getUsers = () => api.get("/users").then((r) => r.data);
export const updateUserRole = (id, role) => api.patch(`/users/${id}/role?role=${role}`).then((r) => r.data);
