import { Outlet } from "react-router-dom"
import { AuthProvider } from "../context/AuthContextV2"

const RootLayout = () => {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

export default RootLayout
