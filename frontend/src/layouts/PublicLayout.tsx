import { Outlet, useLocation } from "react-router-dom"
import PublicNavbar from "../components/navigation/PublicNavbar"
import FooterEnhanced from "../components/common/FooterEnhanced"

const PublicLayout = () => {
  const location = useLocation()
  const isHomePage = location.pathname === "/"
  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(location.pathname)

  return (
    <div className="flex flex-col min-h-screen">
      {!isAuthPage && <PublicNavbar />}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      {isHomePage && <FooterEnhanced />}
    </div>
  )
}

export default PublicLayout
