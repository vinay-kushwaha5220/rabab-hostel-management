import axios, { AxiosError } from "axios"
import type { InternalAxiosRequestConfig } from "axios"

// ==========================================
// CREATE AXIOS INSTANCE
// ==========================================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: Send cookies with requests
})

// ==========================================
// REQUEST INTERCEPTOR
// Add access token to all requests
// ==========================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem("accessToken")
    
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ==========================================
// RESPONSE INTERCEPTOR
// Auto refresh token on 401 errors
// ==========================================
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

api.interceptors.response.use(
  (response) => {
    // If response is successful, return it
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // Check if error is 401 and token expired
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      error.response?.data &&
      typeof error.response.data === "object" &&
      "code" in error.response.data &&
      error.response.data.code === "TOKEN_EXPIRED"
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Call refresh token endpoint
        const REFRESH_URL = import.meta.env.VITE_API_BASE_URL 
          ? `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/api/v2/auth/refresh`
          : "http://localhost:5000/api/v2/auth/refresh"
          
        const response = await axios.post(
          REFRESH_URL,
          {},
          { withCredentials: true }
        )

        const { accessToken: newAccessToken } = response.data

        // Store new access token
        localStorage.setItem("accessToken", newAccessToken)

        // Dispatch event so that React context can update state without circular dependencies
        window.dispatchEvent(new CustomEvent("accessTokenRefreshed", { detail: newAccessToken }))

        // Update authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }

        // Process queued requests
        processQueue(null, newAccessToken)

        console.log("✅ Token refreshed automatically")

        // Retry original request
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh token failed
        processQueue(refreshError, null)

        // Clear auth data
        localStorage.removeItem("accessToken")
        localStorage.removeItem("user")
        window.dispatchEvent(new CustomEvent("authCleared"))

        // Redirect to login
        window.location.href = "/login"

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // NEW: Handle generic 401 errors (e.g., Invalid Token)
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("user")
      window.dispatchEvent(new CustomEvent("authCleared"))
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login"
      }
    }

    // For other errors, reject
    return Promise.reject(error)
  }
)

export default api
