import { useAuth } from "../context/AuthContext"

const DashboardPage = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">

      <h1 className="text-5xl font-bold">
        Welcome {user?.name}
      </h1>

      <button
        onClick={logout}
        className="bg-red-500 text-white px-6 py-3 rounded-lg"
      >
        Logout
      </button>

    </div>
  )
}

export default DashboardPage