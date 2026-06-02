import { createContext, useContext, useState, useEffect, useMemo } from "react"
import type { ReactNode } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import api from "../services/apiV2"

// ==========================================
// TYPES
// ==========================================
interface User {
  id: number
  name: string
  email: string
  phone?: string
  avatar?: string
  role: string
  isActive: boolean
}

interface AuthContextType {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>
  loginWithSocial: (email: string, name: string, provider: "google" | "facebook") => Promise<void>
  logout: () => Promise<void>
  logoutAllDevices: () => Promise<void>
  refreshToken: () => Promise<string | null>
  updateUser: (updatedUser: User) => void
}

// ==========================================
// CREATE CONTEXT
// ==========================================
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ==========================================
// AUTH PROVIDER COMPONENT
// ==========================================
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // ==========================================
  // INITIALIZE - Check if user is logged in
  // ==========================================
  useEffect(() => {
    const initAuth = async () => {
      // Clean up old legacy keys to prevent exposing user details
      localStorage.removeItem("user")
      localStorage.removeItem("token")

      const storedToken = localStorage.getItem("accessToken")

      if (storedToken) {
        setAccessToken(storedToken)

        // Fetch current user from backend using the stored token
        try {
          const response = await api.get("/v2/auth/me", {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          })
          setUser(response.data.user)
        } catch (error) {
          console.error("Failed to fetch user during initialization:", error)
          // As a fallback, check if token was cleared by the interceptor
          const tokenExists = !!localStorage.getItem("accessToken")
          if (!tokenExists) {
            setAccessToken(null)
            setUser(null)
          }
        }
      }

      setIsLoading(false)
    }

    initAuth()
  }, [])

  // ==========================================
  // LISTEN TO AUTO-REFRESH EVENTS
  // ==========================================
  useEffect(() => {
    const handleRefreshed = (event: Event) => {
      const customEvent = event as CustomEvent<string>
      const newToken = customEvent.detail
      setAccessToken(newToken)
    }

    const handleCleared = () => {
      setAccessToken(null)
      setUser(null)
    }

    window.addEventListener("accessTokenRefreshed", handleRefreshed)
    window.addEventListener("authCleared", handleCleared)

    return () => {
      window.removeEventListener("accessTokenRefreshed", handleRefreshed)
      window.removeEventListener("authCleared", handleCleared)
    }
  }, [])

  // ==========================================
  // REGISTER
  // ==========================================
  const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => {
    try {
      const response = await api.post("/v2/auth/register", {
        name,
        email,
        password,
        phone,
        role: "user", // Always register as user, not admin
      })

      // Auto-login after registration
      const { accessToken: newAccessToken } = response.data

      // Store only access token in localStorage
      localStorage.setItem("accessToken", newAccessToken)
      setAccessToken(newAccessToken)

      // Fetch user profile from /auth/me
      const userResponse = await api.get("/v2/auth/me", {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
        },
      })
      const userData = userResponse.data.user
      setUser(userData)

      // Get redirect URL from query params
      const redirectUrl = searchParams.get("redirect")

      // Redirect to booking or dashboard
      if (redirectUrl) {
        navigate(redirectUrl)
      } else {
        navigate("/dashboard")
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed"
      throw new Error(message)
    }
  }

  // ==========================================
  // LOGIN
  // ==========================================
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post(
        "/v2/auth/login",
        { email, password },
        { withCredentials: true } // Important: Send cookies
      )

      const { accessToken: newAccessToken } = response.data

      // Store only access token in localStorage
      localStorage.setItem("accessToken", newAccessToken)
      setAccessToken(newAccessToken)

      // Fetch user profile from /auth/me
      const userResponse = await api.get("/v2/auth/me", {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
        },
      })
      const userData = userResponse.data.user
      setUser(userData)

      // Get redirect URL from query params
      const redirectUrl = searchParams.get("redirect")

      // Redirect based on role and redirect URL
      if (userData.role === "ADMIN") {
        navigate("/admin/dashboard")
      } else if (redirectUrl) {
        // Redirect to the page user was trying to access (e.g., booking page)
        navigate(redirectUrl)
      } else {
        // Default redirect to dashboard
        navigate("/dashboard")
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed"
      throw new Error(message)
    }
  }

  // ==========================================
  // SOCIAL LOGIN
  // ==========================================
  const loginWithSocial = async (email: string, name: string, provider: "google" | "facebook") => {
    try {
      const response = await api.post(
        "/v2/auth/social-login",
        { email, name, provider },
        { withCredentials: true }
      )

      const { accessToken: newAccessToken } = response.data

      // Store only access token in localStorage
      localStorage.setItem("accessToken", newAccessToken)
      setAccessToken(newAccessToken)

      // Fetch user profile from /auth/me
      const userResponse = await api.get("/v2/auth/me", {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
        },
      })
      const userData = userResponse.data.user
      setUser(userData)

      // Get redirect URL from query params
      const redirectUrl = searchParams.get("redirect")

      // Redirect based on role and redirect URL
      if (userData.role === "ADMIN") {
        navigate("/admin/dashboard")
      } else if (redirectUrl) {
        navigate(redirectUrl)
      } else {
        navigate("/dashboard")
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Social login failed"
      throw new Error(message)
    }
  }

  // ==========================================
  // REFRESH ACCESS TOKEN
  // ==========================================
  const refreshToken = async (): Promise<string | null> => {
    try {
      const response = await api.post(
        "/v2/auth/refresh",
        {},
        { withCredentials: true } // Important: Send cookies
      )

      const { accessToken: newAccessToken } = response.data

      // Update access token
      localStorage.setItem("accessToken", newAccessToken)
      setAccessToken(newAccessToken)

      console.log("✅ Access token refreshed successfully")

      return newAccessToken
    } catch (error) {
      console.error("❌ Failed to refresh token:", error)

      // Clear auth state
      localStorage.removeItem("accessToken")
      setAccessToken(null)
      setUser(null)

      // Redirect to login
      navigate("/login")

      return null
    }
  }

  // ==========================================
  // LOGOUT
  // ==========================================
  const logout = async () => {
    try {
      await api.post(
        "/v2/auth/logout",
        {},
        { withCredentials: true }
      )
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear local storage
      localStorage.removeItem("accessToken")

      // Clear state
      setAccessToken(null)
      setUser(null)

      // Redirect to home
      navigate("/")
    }
  }

  // ==========================================
  // LOGOUT FROM ALL DEVICES
  // ==========================================
  const logoutAllDevices = async () => {
    try {
      await api.post(
        "/v2/auth/logout-all",
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      )

      alert("Logged out from all devices successfully")
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to logout from all devices"
      alert(message)
    } finally {
      // Clear local storage
      localStorage.removeItem("accessToken")

      // Clear state
      setAccessToken(null)
      setUser(null)

      // Redirect to home
      navigate("/")
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  // ==========================================
  // CONTEXT VALUE — memoized to prevent
  // child re-renders when value reference changes
  // ==========================================
  const value: AuthContextType = useMemo(() => ({
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    login,
    register,
    loginWithSocial,
    logout,
    logoutAllDevices,
    refreshToken,
    updateUser,
  }), [user, accessToken, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ==========================================
// CUSTOM HOOK TO USE AUTH CONTEXT
// ==========================================
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
