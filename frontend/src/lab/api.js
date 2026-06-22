// Centralized axios client + API helpers for the Medora Lab portal
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send session_token cookie
});

// ------- Auth -------
export const exchangeSession = (session_id) =>
  api.post("/auth/google/exchange", { session_id }).then((r) => r.data);
export const fetchMe = () => api.get("/auth/me").then((r) => r.data);
export const logout = () => api.post("/auth/logout").then((r) => r.data);

// ------- Users / RBAC -------
export const listUsers = () => api.get("/users").then((r) => r.data);
export const listStaff = () => api.get("/users/staff").then((r) => r.data);
export const updateUserRole = (uid, role) =>
  api.patch(`/users/${uid}/role`, { role }).then((r) => r.data);

// ------- Catalog & patients -------
export const fetchCatalog = () => api.get("/lab/catalog").then((r) => r.data);
export const listPatients = () => api.get("/lab/patients").then((r) => r.data);
export const createPatient = (p) => api.post("/lab/patients", p).then((r) => r.data);

// ------- Orders -------
export const listOrders = () => api.get("/lab/orders").then((r) => r.data);
export const getOrder = (id) => api.get(`/lab/orders/${id}`).then((r) => r.data);
export const createOrder = (body) => api.post("/lab/orders", body).then((r) => r.data);
export const createWalkin = (body) => api.post("/lab/orders/walkin", body).then((r) => r.data);
export const collectOrder = (id, note) =>
  api.post(`/lab/orders/${id}/collect`, { note }).then((r) => r.data);
export const rejectCollection = (id, reason) =>
  api.post(`/lab/orders/${id}/reject-collection`, { reason }).then((r) => r.data);
export const startProcess = (id) => api.post(`/lab/orders/${id}/process`).then((r) => r.data);
export const saveOrderResults = (id, results, complete) =>
  api.post(`/lab/orders/${id}/results`, { results, complete }).then((r) => r.data);
export const validateOrderApi = (id, comment) =>
  api.post(`/lab/orders/${id}/validate`, { comment }).then((r) => r.data);
export const rejectValidationApi = (id, reason) =>
  api.post(`/lab/orders/${id}/reject-validation`, { reason }).then((r) => r.data);
export const cancelOrderApi = (id, reason) =>
  api.post(`/lab/orders/${id}/cancel`, { reason }).then((r) => r.data);

// ------- Analytics -------
export const fetchAnalytics = () => api.get("/lab/analytics").then((r) => r.data);

// ------- Dev seed -------
export const seedDemo = () => api.post("/dev/seed").then((r) => r.data);
