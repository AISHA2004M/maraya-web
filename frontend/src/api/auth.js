import api from "./client";

export const login = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};

export const register = async (email, password, full_name) => {
  const res = await api.post("/auth/register", { email, password, full_name });
  return res.data;
};
