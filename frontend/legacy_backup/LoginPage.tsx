import { useState } from "react"
import { useNavigate } from "react-router-dom"

import api from "../services/apiV2"
import { useAuth } from "../context/AuthContextV2"

const LoginPage = () => {
  const navigate = useNavigate()

  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] =
    useState("")

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    try {
      const response = await api.post(
        "/auth/login",
        {
          email,
          password,
        }
      )

      login(
        response.data.user,
        response.data.token
      )

      alert("Login successful")

      const params = new URLSearchParams(window.location.search)
      const redirectPath = params.get('redirect')

      if (redirectPath) {
        navigate(redirectPath)
      } else if (response.data.user.role === "admin") {
        navigate("/admin/dashboard")
      } else {
        navigate("/dashboard") // User dashboard
      }
    } catch (error: any) {
      alert(error.response.data.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md">

        <h1 className="text-4xl font-bold text-center mb-8">
          Login
        </h1>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          <input
            type="email"
            placeholder="Email"
            className="w-full border p-3 rounded-lg"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border p-3 rounded-lg"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button className="w-full bg-blue-600 text-white py-3 rounded-lg">
            Login
          </button>

        </form>

      </div>

    </div>
  )
}

export default LoginPage