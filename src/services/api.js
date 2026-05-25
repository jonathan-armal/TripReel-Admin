import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// ── Upload ────────────────────────────────────────────────────────────────────
export const uploadAPI = {
    // Upload a base64 data URI, returns { url }
    uploadBase64: (data, filename) => api.post('/upload', { data, filename }),
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (data) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersAPI = {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    updateStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
    delete: (id) => api.delete(`/users/${id}`),
}

// ── Banners ───────────────────────────────────────────────────────────────────
export const bannersAPI = {
    getAll: () => api.get('/banners'),
    create: (data) => api.post('/banners', data),
    update: (id, data) => api.put(`/banners/${id}`, data),
    delete: (id) => api.delete(`/banners/${id}`),
}

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesAPI = {
    getAll: () => api.get('/categories'),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
}

// ── Packages ──────────────────────────────────────────────────────────────────
export const packagesAPI = {
    getAll: (params) => api.get('/packages', { params }),
    getById: (id) => api.get(`/packages/${id}`),
    create: (data) => api.post('/packages', data),
    update: (id, data) => api.put(`/packages/${id}`, data),
    delete: (id) => api.delete(`/packages/${id}`),
}

// ── Templates (Layer A) ───────────────────────────────────────────────────────
export const templatesAPI = {
    getAll: (params) => api.get('/templates', { params }),
    getById: (id) => api.get(`/templates/${id}`),
    create: (data) => api.post('/templates', data),
    update: (id, data) => api.put(`/templates/${id}`, data),
    delete: (id) => api.delete(`/templates/${id}`),
}

// ── Listings (Layer B) ────────────────────────────────────────────────────────
export const listingsAPI = {
    getAll: (params) => api.get('/listings', { params }),
    getById: (id) => api.get(`/listings/${id}`),
}

// ── Popular Destinations ──────────────────────────────────────────────────────
export const destinationsAPI = {
    getAll: (params) => api.get('/popular-destinations', { params }),
    getById: (id) => api.get(`/popular-destinations/${id}`),
    create: (data) => api.post('/popular-destinations', data),
    update: (id, data) => api.put(`/popular-destinations/${id}`, data),
    delete: (id) => api.delete(`/popular-destinations/${id}`),
}

// ── Experiences ───────────────────────────────────────────────────────────────
export const experiencesAPI = {
    getAll: (params) => api.get('/experiences', { params }),
    getById: (id) => api.get(`/experiences/${id}`),
    create: (data) => api.post('/experiences', data),
    update: (id, data) => api.put(`/experiences/${id}`, data),
    delete: (id) => api.delete(`/experiences/${id}`),
}

// ── Trips ─────────────────────────────────────────────────────────────────────
export const tripsAPI = {
    getAll: (params) => api.get('/trips', { params }),
    getMy: () => api.get('/trips/my'),
    getById: (id) => api.get(`/trips/${id}`),
    create: (data) => api.post('/trips', data),
    updateStatus: (id, status) => api.patch(`/trips/${id}/status`, { status }),
    delete: (id) => api.delete(`/trips/${id}`),
}

// ── Bookings (Layer C) ────────────────────────────────────────────────────────
export const bookingsAPI = {
    getAll: (params) => api.get('/bookings', { params }),
    getById: (id) => api.get(`/bookings/${id}`),
    updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
}

// ── Wishlists ─────────────────────────────────────────────────────────────────
export const wishlistsAPI = {
    getAll: (params) => api.get('/wishlists', { params }),
    getMy: () => api.get('/wishlists/my'),
    create: (data) => api.post('/wishlists', data),
    addPackage: (id, packageId) => api.post(`/wishlists/${id}/packages`, { packageId }),
    removePackage: (id, packageId) => api.delete(`/wishlists/${id}/packages/${packageId}`),
    delete: (id) => api.delete(`/wishlists/${id}`),
}

// ── Reels ─────────────────────────────────────────────────────────────────────
export const reelsAPI = {
    getAll: (params) => api.get('/reels', { params }),
    getById: (id) => api.get(`/reels/${id}`),
    create: (formData, config = {}) => api.post('/reels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        ...config,
    }),
    update: (id, formData, config = {}) => api.put(`/reels/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        ...config,
    }),
    delete: (id) => api.delete(`/reels/${id}`),
}

export default api

// ── Operator API ──────────────────────────────────────────────────────────────
const operatorApi = axios.create({ baseURL: '/api' })
operatorApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('operatorToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

export const operatorAuthAPI = {
    register: (data) => operatorApi.post('/operators/auth/register', data),
    login: (data) => operatorApi.post('/operators/auth/login', data),
    getMe: () => operatorApi.get('/operators/auth/me'),
    submitOnboarding: (formData, config = {}) => operatorApi.post('/operators/onboarding', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        ...config,
    }),
    reuploadDocument: (formData, config = {}) => operatorApi.patch('/operators/documents/reupload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        ...config,
    }),
}

export const adminOperatorsAPI = {
    getAll: (params) => api.get('/operators', { params }),
    getById: (id) => api.get(`/operators/${id}`),
    transitionState: (id, data) => api.patch(`/operators/${id}/state`, data),
    updateDocumentStatus: (id, data) => api.patch(`/operators/${id}/document-status`, data),
}

// ── Admin Package Review API ──────────────────────────────────────────────────
export const adminPackagesAPI = {
    getAll: (params) => api.get('/packages/admin/all', { params }),
    review: (id, data) => api.patch(`/packages/${id}/review`, data),
    delete: (id) => api.delete(`/packages/${id}`),
    getById: (id) => api.get(`/packages/${id}`),
}

export const adminListingsAPI = {
    getAll: (params) => api.get('/listings/admin/all', { params }),
    review: (id, data) => api.patch(`/listings/${id}/review`, data),
    getById: (id) => api.get(`/listings/${id}`),
}

// ── Operator Package API ──────────────────────────────────────────────────────
export const operatorPackagesAPI = {
    getMine: () => operatorApi.get('/packages/operator/mine'),
    create: (formData) => operatorApi.post('/packages/operator', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    update: (id, formData) => operatorApi.put(`/packages/operator/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    delete: (id) => operatorApi.delete(`/packages/operator/${id}`),
}

export const operatorTemplatesAPI = {
    getAll: (params) => operatorApi.get('/templates', { params }),
    getById: (id) => operatorApi.get(`/templates/${id}`),
}

export const operatorListingsAPI = {
    getMine: () => operatorApi.get('/listings/operator/mine'),
    create: (data) => operatorApi.post('/listings/operator', data),
    update: (id, data) => operatorApi.put(`/listings/operator/${id}`, data),
    delete: (id) => operatorApi.delete(`/listings/operator/${id}`),
}
