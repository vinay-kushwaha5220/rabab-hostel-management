import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContextV2"
import UserDashboard from "./UserDashboard"

const DashboardPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin/dashboard")
    }
  }, [user, navigate])

  // Show user dashboard for regular users
  if (user?.role === "user") {
    return <UserDashboard />
  }

  // Fallback (shouldn't reach here)
  return null
}

export default DashboardPage