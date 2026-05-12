import type { RoomType } from "./room"

export type BookingType = {
  id: number
  bookingId: string
  
  // Customer details
  userId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAadhaar?: string
  
  // Room details
  roomId: number
  room?: RoomType
  
  // Booking details
  checkInDate: string
  checkOutDate: string
  numberOfGuests: number
  totalDays: number
  totalAmount: number
  
  // Status
  status: "pending" | "confirmed" | "cancelled" | "completed"
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
  
  // Timestamps
  createdAt: string
  updatedAt: string
  
  // Relations
  payment?: PaymentType
}

export type PaymentType = {
  id: number
  bookingId: number
  amount: number
  paymentMethod: string
  transactionId?: string
  paymentStatus: "pending" | "success" | "failed"
  createdAt: string
  updatedAt: string
}

export type CreateBookingData = {
  roomId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAadhaar?: string
  checkInDate: string
  checkOutDate: string
  numberOfGuests: number
}
