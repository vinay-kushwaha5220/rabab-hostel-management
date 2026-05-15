import { Outlet } from "react-router-dom"
import Navbar from "../components/common/Navbar"
import FooterEnhanced from "../components/common/FooterEnhanced"

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <FooterEnhanced />
    </div>
  )
}

export default MainLayout