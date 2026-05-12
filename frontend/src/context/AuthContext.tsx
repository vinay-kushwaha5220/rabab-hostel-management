import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react"

type UserType = {
  name: string
  email: string
}

type AuthContextType = {
  user: UserType | null
  token: string | null
  login: (
    userData: UserType,
    token: string
  ) => void
  logout: () => void
}

const AuthContext =
  createContext<AuthContextType | null>(null)

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [user, setUser] =
    useState<UserType | null>(null)

  const [token, setToken] =
    useState<string | null>(null)

  // auto login
  useEffect(() => {
    const savedToken =
      localStorage.getItem("token")

    const savedUser =
      localStorage.getItem("user")

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = (
    userData: UserType,
    token: string
  ) => {
    setUser(userData)
    setToken(token)

    localStorage.setItem("token", token)

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    )
  }

  const logout = () => {
    setUser(null)
    setToken(null)

    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth error")
  }

  return context
}