import { Outlet, useLocation } from "react-router-dom"
import PublicNavbar from "../components/navigation/PublicNavbar"
import FooterEnhanced from "../components/common/FooterEnhanced"

const PublicLayout = () => {
  const location = useLocation()
  const isHomePage = location.pathname === "/"

  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {isHomePage && <FooterEnhanced />}
    </div>
  )
}

export default PublicLayout
