import api from "./client";

export const getProducts = async (params = {}) => {
  const res = await api.get("/products", { params });
  return res.data;
};

export const getProductById = async (id) => {
  const res = await api.get(`/products/${id}`);
  return res.data;
};

export const getBrands = async () => {
  const res = await api.get("/products/brands/all");
  return res.data;
};

export const getBrandById = async (id) => {
  const res = await api.get(`/products/brands/${id}`);
  return res.data;
};

export const getCategories = async () => {
  const res = await api.get("/products/categories/all");
  return res.data;
};
