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
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "VERIFICATION_PENDING"
  stayStatus?: "BOOKED" | "CHECKED_IN" | "STAYING" | "CHECKED_OUT"
  
  // Timestamps
  createdAt: string
  updatedAt: string
  
  // Relations
  payment?: PaymentType[]
}

export type PaymentType = {
  id: number
  bookingId: number
  amount: number
  paymentMethod: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "ONLINE"
  transactionId?: string
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "VERIFICATION_PENDING"
  verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED"
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
