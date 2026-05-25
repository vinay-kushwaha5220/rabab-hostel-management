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
      const storedToken = localStorage.getItem("accessToken")
      const storedUser = localStorage.getItem("user")

      if (storedToken && storedUser) {
        setAccessToken(storedToken)
        setUser(JSON.parse(storedUser))
        
        // Verify token is still valid by fetching current user
        try {
          const response = await api.get("/v2/auth/me", {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          })
          setUser(response.data.user)
          localStorage.setItem("user", JSON.stringify(response.data.user))
        } catch (error) {
          // Token might be expired, try to refresh
          const newToken = await refreshToken()
          if (!newToken) {
            // Refresh failed, clear auth
            localStorage.removeItem("accessToken")
            localStorage.removeItem("user")
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
      const { accessToken: newAccessToken, user: userData } = response.data

      // Store tokens
      localStorage.setItem("accessToken", newAccessToken)
      localStorage.setItem("user", JSON.stringify(userData))

      setAccessToken(newAccessToken)
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

      const { accessToken: newAccessToken, user: userData } = response.data

      // Store access token in localStorage
      localStorage.setItem("accessToken", newAccessToken)
      localStorage.setItem("user", JSON.stringify(userData))

      setAccessToken(newAccessToken)
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
      localStorage.removeItem("user")
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
      localStorage.removeItem("user")

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
      localStorage.removeItem("user")

      // Clear state
      setAccessToken(null)
      setUser(null)

      // Redirect to home
      navigate("/")
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem("user", JSON.stringify(updatedUser))
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
