import { createBrowserRouter } from "react-router-dom"
import RegisterPage from "../pages/RegisterPage"
import MainLayout from "../layouts/MainLayout"
import RoomDetailsPage from "../pages/RoomDetailsPage"
import HomePage from "../pages/HomePage"
import RoomsPage from "../pages/RoomsPage"
import ContactPage from "../pages/ContactPage"
import LoginPage from "../pages/LoginPage"
import DashboardPage from "../pages/DashboardPage"
import ProtectedRoute from "./ProtectedRoute"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />
      },
      {
        path: "/rooms",
        element: <RoomsPage />
      },
      {
        path: "/contact",
        element: <ContactPage />
      },
      {
        path: "/login",
        element: <LoginPage />
      },
      {
  path: "/rooms/:id",
  element: <RoomDetailsPage />
},
      {
        path: "/register",
        element: <RegisterPage />
      },
      {
  path: "/dashboard",
  element: (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  )
}
    ]
  }
])