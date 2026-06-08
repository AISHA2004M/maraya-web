import api from "./client";

export const getProducts = () => api.get("/products").then((r) => r.data);
export const getProduct = (id) => api.get(`/products/${id}`).then((r) => r.data);
export const createProduct = (data) => api.post("/products", data).then((r) => r.data);
export const updateProduct = (id, data) => api.patch(`/products/${id}`, data).then((r) => r.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const getBrands = () => api.get("/products/brands/all").then((r) => r.data);
export const getCategories = () => api.get("/products/categories/all").then((r) => r.data);
