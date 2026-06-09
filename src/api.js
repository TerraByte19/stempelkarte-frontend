import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
})

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token && token !== 'undefined' && token !== 'null') {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    response => {
        // HTML statt JSON = Request ging an falsche URL (SPA-Rewrite)
        if (typeof response.data === 'string' && response.data.trimStart().startsWith('<!doctype')) {
            return Promise.reject(new Error('API antwortet mit HTML — VITE_API_URL prüfen'))
        }
        return response
    },
    error => {
        // Nicht auf Login/Register-Fehler reagieren (401 = falsches Passwort)
        const isAuthRoute = error.config?.url?.includes('/api/auth/')
        if ((error.response?.status === 401 || error.response?.status === 403) && !isAuthRoute) {
            localStorage.removeItem('token')
            localStorage.removeItem('shop')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api