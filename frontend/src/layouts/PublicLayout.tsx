import { Outlet } from "react-router-dom"
import PublicNavbar from "../components/navigation/PublicNavbar"
import FooterEnhanced from "../components/common/FooterEnhanced"

const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <FooterEnhanced />
    </div>
  )
}

export default PublicLayout
