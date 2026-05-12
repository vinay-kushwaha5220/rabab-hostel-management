import { createBrowserRouter } from "react-router-dom"

import MainLayout from "../layouts/MainLayout"
import RoomDetailsPage from "../pages/RoomDetailsPage"
import HomePage from "../pages/HomePage"
import RoomsPage from "../pages/RoomsPage"
import ContactPage from "../pages/ContactPage"
import LoginPage from "../pages/LoginPage"

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
}
    ]
  }
])