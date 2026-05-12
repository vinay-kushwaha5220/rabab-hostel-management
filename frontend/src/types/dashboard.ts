import type { BookingType } from "./booking"

export type DashboardStats = {
  rooms: {
    total: number
    available: number
    booked: number
    ac: number
    nonAc: number
  }
  earnings: {
    total: number
    monthly: number
  }
  bookings: {
    total: number
    pending: number
    confirmed: number
  }
  recentBookings: BookingType[]
  unreadNotifications: number
}

export type NotificationType = {
  id: number
  bookingId: number
  title: string
  message: string
  type: "booking" | "payment" | "cancellation"
  isRead: boolean
  createdAt: string
  booking?: {
    bookingId: string
    room: {
      roomNumber: string
      title: string
    }
  }
}
