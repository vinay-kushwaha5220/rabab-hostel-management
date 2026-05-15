export interface MonthlyBill {
  id: number
  bookingId: number
  month: string
  rentAmount: number
  electricityAmount: number
  extraCharges: number
  totalAmount: number
  dueDate: string
  isPaid: boolean
  paidDate?: string
  status: "PENDING" | "PAID_ONLINE" | "PAID_CASH" | "OVERDUE" | "VERIFICATION_PENDING"
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED"
  createdAt: string
  updatedAt: string
  booking?: {
    id: number
    bookingId: string
    customerName: string
    room: {
      roomNumber: string
    }
    user: {
      name: string
      email: string
    }
  }
}

export interface Message {
  id: number
  bookingId: number
  senderId: number
  receiverId: number
  content: string
  isRead: boolean
  readAt?: string
  createdAt: string
  sender?: {
    id: number
    name: string
    email: string
  }
  receiver?: {
    id: number
    name: string
    email: string
  }
}

export interface Payment {
  id: number
  bookingId: number
  monthlyBillId?: number
  amount: number
  paymentMethod: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "ONLINE"
  transactionId?: string
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "VERIFICATION_PENDING"
  verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED"
  createdAt: string
  updatedAt: string
}

export interface RenterDashboardData {
  activeBooking: any
  monthlyBill: MonthlyBill | null
  messages: Message[]
  notifications: any[]
}
