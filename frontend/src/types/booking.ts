import type { RoomType } from "./room"

export type MonthlyRenterType = {
  id: number
  userId: number
  bookingId: number
  roomId: number
  joinDate: string
  lastPaidDate?: string
  currentCycleStart?: string
  currentCycleEnd?: string
  dueDate?: string
  nextDueDate: string
  stayStatus: "BOOKED" | "CHECKED_IN" | "STAYING" | "CHECKED_OUT"
  rentAmount: number
  securityAmount: number
  paidAmount: number
  pendingAmount: number
  overdueDays: number
  status: "ACTIVE" | "DUE_SOON" | "EXPIRES_TODAY" | "RENEWAL_PENDING" | "PENDING_ADMIN_APPROVAL" | "STAY_CONTINUED" | "PENDING_PAYMENT" | "OVERDUE" | "CHECKOUT_REQUESTED" | "CHECKED_OUT" | "CONTINUE_REQUESTED"
  paymentStatus?: string
  renewalRequestDate?: string
  renewalDecisionDate?: string
  checkoutRequestDate?: string
  latePenalty: number
  lastElectricityAmount: number
  user?: {
    id: number
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export type StayRenewalRequestType = {
  id: number
  bookingId: number
  monthlyRenterId: number
  requestType: "CONTINUE_STAY" | "CHECKOUT"
  status: "PENDING" | "APPROVED" | "REJECTED"
  requestDate: string
  decisionDate?: string
  generatedBillId?: number
  nextCycleStart?: string
  nextCycleEnd?: string
  rejectionReason?: string
  approvalNotes?: string
  createdAt: string
  updatedAt: string
  booking?: BookingType
  monthlyRenter?: MonthlyRenterType
}

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
  bookingType: "DAILY" | "MONTHLY"
  checkInDate: string
  checkOutDate: string
  numberOfGuests: number
  totalDays: number
  totalAmount: number
  
  // Status
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "VERIFICATION_PENDING"
  stayStatus?: "BOOKED" | "CHECKED_IN" | "STAYING" | "CHECKED_OUT"
  
  // Monthly renter details (if applicable)
  monthlyRenter?: MonthlyRenterType
  monthlyBills?: Array<{ remainingAmount: number }>
  renewalRequests?: StayRenewalRequestType[]

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
  bookingType: "DAILY" | "MONTHLY"
}
