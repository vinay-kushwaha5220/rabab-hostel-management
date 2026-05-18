import { useState } from "react"
import api from "../services/apiV2"

const RegisterPage = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] =
    useState("")

  const handleRegister = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    try {
      const response = await api.post(
        "/auth/register",
        {
          name,
          email,
          password,
        }
      )

      alert(response.data.message)
    } catch (error: any) {
      alert(error.response.data.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md">

        <h1 className="text-4xl font-bold text-center mb-8">
          Register
        </h1>

        <form
          onSubmit={handleRegister}
          className="space-y-5"
        >

          <input
            type="text"
            placeholder="Full Name"
            className="w-full border p-3 rounded-lg"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

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
            Register
          </button>

        </form>

      </div>

    </div>
  )
}

export default RegisterPage