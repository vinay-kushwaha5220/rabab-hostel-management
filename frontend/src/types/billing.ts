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
  createdAt: string
  updatedAt: string
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
  paymentMethod: string
  transactionId?: string
  paymentStatus: string
  createdAt: string
  updatedAt: string
}

export interface RenterDashboardData {
  activeBooking: any
  monthlyBill: MonthlyBill | null
  messages: Message[]
  notifications: any[]
}
