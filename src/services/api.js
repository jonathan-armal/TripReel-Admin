import axios from "axios";

// Auto-detect: local dev uses proxy (/api), deployed uses Render backend directly
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const BASE_URL = isLocal ? "/api" : "https://tripreel-backend.onrender.com/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors — only clear admin session, not operator
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect if no operator session exists
      const hasOperatorSession = localStorage.getItem("operatorToken");
      if (!hasOperatorSession) {
        window.location.href = "/admin-login";
      }
    }
    return Promise.reject(error);
  },
);

// ── Upload ────────────────────────────────────────────────────────────────────
export const uploadAPI = {
  // Upload a base64 data URI, returns { url }
  uploadBase64: (data, filename) => api.post("/upload", { data, filename }),
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (data) => api.post("/auth/register", data),
  getMe: () => api.get("/auth/me"),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  updateStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  delete: (id) => api.delete(`/users/${id}`),
};

// ── Banners ───────────────────────────────────────────────────────────────────
export const bannersAPI = {
  getAll: () => api.get("/banners"),
  create: (data) => api.post("/banners", data),
  update: (id, data) => api.put(`/banners/${id}`, data),
  delete: (id) => api.delete(`/banners/${id}`),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesAPI = {
  getAll: () => api.get("/categories"),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ── Packages ──────────────────────────────────────────────────────────────────
export const packagesAPI = {
  getAll: (params) => api.get("/packages", { params }),
  getById: (id) => api.get(`/packages/${id}`),
  create: (data) => api.post("/packages", data),
  update: (id, data) => api.put(`/packages/${id}`, data),
  delete: (id) => api.delete(`/packages/${id}`),
};

// ── Templates (Layer A) ───────────────────────────────────────────────────────
export const templatesAPI = {
  getAll: (params) => api.get("/templates", { params }),
  getById: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post("/templates", data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
};

// ── Listings (Layer B) ────────────────────────────────────────────────────────
export const listingsAPI = {
  getAll: (params) => api.get("/listings", { params }),
  getById: (id) => api.get(`/listings/${id}`),
};

// ── Popular Destinations ──────────────────────────────────────────────────────
export const destinationsAPI = {
  getAll: (params) => api.get("/popular-destinations", { params }),
  getById: (id) => api.get(`/popular-destinations/${id}`),
  create: (data) => api.post("/popular-destinations", data),
  update: (id, data) => api.put(`/popular-destinations/${id}`, data),
  delete: (id) => api.delete(`/popular-destinations/${id}`),
};

// ── Experiences ───────────────────────────────────────────────────────────────
export const experiencesAPI = {
  getAll: (params) => api.get("/experiences", { params }),
  getById: (id) => api.get(`/experiences/${id}`),
  create: (data) => api.post("/experiences", data),
  update: (id, data) => api.put(`/experiences/${id}`, data),
  delete: (id) => api.delete(`/experiences/${id}`),
};

// ── Trips ─────────────────────────────────────────────────────────────────────
export const tripsAPI = {
  getAll: (params) => api.get("/trips", { params }),
  getMy: () => api.get("/trips/my"),
  getById: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post("/trips", data),
  updateStatus: (id, status) => api.patch(`/trips/${id}/status`, { status }),
  delete: (id) => api.delete(`/trips/${id}`),
};

// ── Bookings (Layer C) ────────────────────────────────────────────────────────
export const bookingsAPI = {
  getAll: (params) => api.get("/bookings", { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
};

// ── Wishlists ─────────────────────────────────────────────────────────────────
export const wishlistsAPI = {
  getAll: (params) => api.get("/wishlists", { params }),
  getMy: () => api.get("/wishlists/my"),
  create: (data) => api.post("/wishlists", data),
  addPackage: (id, packageId) =>
    api.post(`/wishlists/${id}/packages`, { packageId }),
  removePackage: (id, packageId) =>
    api.delete(`/wishlists/${id}/packages/${packageId}`),
  delete: (id) => api.delete(`/wishlists/${id}`),
};

// ── Reels ─────────────────────────────────────────────────────────────────────
export const reelsAPI = {
  getAll: (params) => api.get("/reels", { params }),
  getById: (id) => api.get(`/reels/${id}`),
  create: (formData, config = {}) =>
    api.post("/reels", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      ...config,
    }),
  update: (id, formData, config = {}) =>
    api.put(`/reels/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      ...config,
    }),
  delete: (id) => api.delete(`/reels/${id}`),
};

export default api;

// ── Operator API ──────────────────────────────────────────────────────────────
const operatorApi = axios.create({ baseURL: BASE_URL });
operatorApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("operatorToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const operatorAuthAPI = {
  register: (data) => operatorApi.post("/operators/auth/register", data),
  login: (data) => operatorApi.post("/operators/auth/login", data),
  getMe: () => operatorApi.get("/operators/auth/me"),
  updateProfile: (data) => operatorApi.patch("/operators/auth/profile", data),
  uploadPhoto: (formData) =>
    operatorApi.post("/operators/auth/profile-photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  submitOnboarding: (formData, config = {}) =>
    operatorApi.post("/operators/onboarding", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      ...config,
    }),
  reuploadDocument: (formData, config = {}) =>
    operatorApi.patch("/operators/documents/reupload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      ...config,
    }),
};

export const adminOperatorsAPI = {
  getAll: (params) => api.get("/operators", { params }),
  getById: (id) => api.get(`/operators/${id}`),
  getStats: (id) => api.get(`/operators/${id}/stats`),
  transitionState: (id, data) => api.patch(`/operators/${id}/state`, data),
  updateDocumentStatus: (id, data) =>
    api.patch(`/operators/${id}/document-status`, data),
};

// ── Sidebar Counts (real-time badges) ─────────────────────────────────────────
export const sidebarCountsAPI = {
  getAdmin: () => api.get("/sidebar-counts/admin"),
  markAdminSeen: (section) =>
    api.post("/sidebar-counts/admin/seen", { section }),
  getOperator: () => operatorApi.get("/sidebar-counts/operator"),
  markOperatorSeen: (section) =>
    operatorApi.post("/sidebar-counts/operator/seen", { section }),
};

// ── Campaigns ─────────────────────────────────────────────────────────────────
export const campaignsAPI = {
  getAll: () => api.get("/campaigns"),
  getActive: () => api.get("/campaigns/active"),
  create: (data) => api.post("/campaigns", data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
  trackClick: (id) => api.post(`/campaigns/click/${id}`),
};

// ── App Screens (splash + slider) ─────────────────────────────────────────────
export const appScreensAPI = {
  get: () => api.get("/app-screens"),
  updateSplash: (splashImageUrl) =>
    api.put("/app-screens/splash", { splashImageUrl }),
  updateSlides: (slides) => api.put("/app-screens/slides", { slides }),
};

// ── Admin Package Review API ──────────────────────────────────────────────────
export const adminPackagesAPI = {
  getAll: (params) => api.get("/packages/admin/all", { params }),
  review: (id, data) => api.patch(`/packages/${id}/review`, data),
  delete: (id) => api.delete(`/packages/${id}`),
  getById: (id) => api.get(`/packages/${id}`),
};

export const adminListingsAPI = {
  getAll: (params) => api.get("/listings/admin/all", { params }),
  review: (id, data) => api.patch(`/listings/${id}/review`, data),
  getById: (id) => api.get(`/listings/${id}`),
};

// ── Operator Package API ──────────────────────────────────────────────────────
export const operatorPackagesAPI = {
  getMine: () => operatorApi.get("/packages/operator/mine"),
  create: (formData) =>
    operatorApi.post("/packages/operator", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, formData) =>
    operatorApi.put(`/packages/operator/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => operatorApi.delete(`/packages/operator/${id}`),
};

export const operatorTemplatesAPI = {
  getAll: (params) => operatorApi.get("/templates", { params }),
  getById: (id) => operatorApi.get(`/templates/${id}`),
};

export const operatorListingsAPI = {
  getMine: () => operatorApi.get("/listings/operator/mine"),
  create: (data) => operatorApi.post("/listings/operator", data),
  update: (id, data) => operatorApi.put(`/listings/operator/${id}`, data),
  delete: (id) => operatorApi.delete(`/listings/operator/${id}`),
};

// ── New Booking System ────────────────────────────────────────────────────────

// Admin — trip bookings
export const adminTripBookingsAPI = {
  getAll: (params) => api.get("/trip-bookings", { params }),
  getById: (id) => api.get(`/trip-bookings/${id}`),
  updateStatus: (id, status, cancelReason) =>
    api.patch(`/trip-bookings/${id}/status`, { status, cancelReason }),
};

// Admin — batches
export const adminBatchesAPI = {
  getAll: (params) => api.get("/batches/admin/all", { params }),
  getById: (id) => api.get(`/batches/${id}`),
  toggleActive: (id) => api.patch(`/batches/${id}/active`),
  getForPackage: (packageId) => api.get("/batches", { params: { packageId } }),
};

// Admin — platform settings
export const platformSettingsAPI = {
  getAll: () => api.get("/settings"),
  update: (key, value) => api.patch(`/settings/${key}`, { value }),
  getPublicDefaults: () => api.get("/settings/public"),
};

// Operator can also fetch defaults for form auto-fill
export const operatorSettingsAPI = {
  getDefaults: () => operatorApi.get("/settings/public"),
};

// Admin — operator wallets
export const walletAdminAPI = {
  getAll: (params) => api.get("/wallet/admin/all", { params }),
  getByOperator: (operatorId) => api.get(`/wallet/admin/${operatorId}`),
};

// Admin — cron
export const cronAPI = {
  run: () => api.post("/cron/run"),
};

// Admin — Revenue Dashboard
export const revenueAPI = {
  getDashboard: () => api.get("/admin/revenue/dashboard"),
  getCancellations: () => api.get("/admin/revenue/cancellations"),
};

// Admin — Reports (user issues)
export const reportsAPI = {
  getAll: (params) => api.get("/reports", { params }),
  update: (id, data) => api.patch(`/reports/${id}`, data),
};

// Admin — Push Notifications
export const notificationsAdminAPI = {
  sendToUser: (userId, title, body) =>
    api.post("/notifications/send", { userId, title, body }),
  sendToAll: (title, body, imageUrl) =>
    api.post("/notifications/send", { title, body, imageUrl }),
  sendToTopic: (topic, title, body) =>
    api.post("/notifications/send", { topic, title, body }),
  getMy: () => api.get("/notifications/admin/all"),
  markAllRead: () => api.patch("/notifications/mark-read"),
};

// Operator — Notifications
export const operatorNotificationsAPI = {
  getMy: () => operatorApi.get("/notifications/operator/my"),
  markAllRead: () => operatorApi.patch("/notifications/operator/mark-read"),
};

// Admin — Suspend Package
export const adminPackageSuspendAPI = {
  toggle: (id) => api.patch(`/packages/${id}/suspend`),
};

// Operator — Reviews for their packages
export const operatorReviewsAPI = {
  getMine: () => operatorApi.get("/packages/operator/reviews"),
};

// Operator — batches
export const operatorBatchesAPI = {
  getMine: (params) => operatorApi.get("/batches/operator/mine", { params }),
  getForPackage: (packageId) =>
    operatorApi.get("/batches", { params: { packageId } }),
  create: (data) => operatorApi.post("/batches", data),
  clone: (id, data) => operatorApi.post(`/batches/${id}/clone`, data),
  update: (id, data) => operatorApi.put(`/batches/${id}`, data),
  delete: (id) => operatorApi.delete(`/batches/${id}`),
};

// Operator — bookings for their packages
export const operatorTripBookingsAPI = {
  getMine: (params) => operatorApi.get("/operator-bookings", { params }),
};

// Operator — wallet
export const operatorWalletAPI = {
  get: () => operatorApi.get("/wallet"),
  getTransactions: (params) =>
    operatorApi.get("/wallet/transactions", { params }),
};

// Operator — coupons
export const operatorCouponsAPI = {
  getMine: (params) => operatorApi.get("/coupons/operator/mine", { params }),
  create: (data) => operatorApi.post("/coupons", data),
  update: (id, data) => operatorApi.put(`/coupons/${id}`, data),
  delete: (id) => operatorApi.delete(`/coupons/${id}`),
};

// Operator — wishlist stats (how many users wishlisted their packages)
export const operatorWishlistAPI = {
  getStats: () => operatorApi.get("/wishlists/operator/stats"),
};

// Chat APIs
export const chatAdminAPI = {
  getConversations: () => api.get("/chat/admin/conversations"),
  getMessages: (id) => api.get(`/chat/admin/${id}/messages`),
  sendMessage: (id, data) => api.post(`/chat/admin/${id}/messages`, data),
};

export const operatorChatAPI = {
  getConversations: () => operatorApi.get("/chat/operator/conversations"),
  getMessages: (id) => operatorApi.get(`/chat/operator/${id}/messages`),
  sendMessage: (id, data) =>
    operatorApi.post(`/chat/operator/${id}/messages`, data),
  sendToUser: (userId, data) =>
    operatorApi.post(`/chat/operator/send-to-user/${userId}`, data),
};
