import api from "./apiV2"
import type { MonthlyBill, Message, Payment, RenterDashboardData } from "../types/billing"

// ==========================================
// MONTHLY BILLS
// ==========================================
export const billingService = {
  // Renter endpoints
  getRenterDashboard: async (): Promise<RenterDashboardData> => {
    const response = await api.get("/monthly-bills/renter/dashboard")
    return response.data
  },

  getRenterBills: async (): Promise<MonthlyBill[]> => {
    const response = await api.get("/monthly-bills/renter/bills")
    return response.data
  },

  getBill: async (billId: number): Promise<MonthlyBill> => {
    const response = await api.get(`/monthly-bills/${billId}`)
    return response.data
  },

  renewStay: async (data: { paymentMethod: string }): Promise<any> => {
    const response = await api.post("/monthly-bills/renter/renew", data)
    return response.data
  },

  requestCheckout: async (): Promise<any> => {
    const response = await api.post("/monthly-bills/renter/request-checkout")
    return response.data
  },

  rejectCheckout: async (bookingId: number): Promise<any> => {
    const response = await api.post(`/monthly-bills/admin/reject-checkout/${bookingId}`)
    return response.data
  },

  // Professional Renewal Lifecycle - Renter
  requestContinueStay: async (): Promise<any> => {
    const response = await api.post("/monthly-bills/renter/continue-stay")
    return response.data
  },

  requestCheckoutNew: async (data?: { reason?: string, expectedCheckoutDate?: string }): Promise<any> => {
    const response = await api.post("/monthly-bills/renter/checkout", data)
    return response.data
  },

  // Professional Renewal Lifecycle - Admin
  getPendingRenewalRequests: async (filters: { requestType?: string, status?: string } = {}): Promise<any[]> => {
    const params = new URLSearchParams()
    if (filters.requestType) params.append("requestType", filters.requestType)
    if (filters.status) params.append("status", filters.status)
    const response = await api.get(`/monthly-bills/admin/renewal-requests?${params}`)
    return response.data
  },

  approveContinueStay: async (requestId: number, data: { electricityAmount?: number, otherCharges?: number, notes?: string }): Promise<any> => {
    const response = await api.post(`/monthly-bills/admin/renewal-requests/${requestId}/approve`, data)
    return response.data
  },

  rejectContinueStay: async (requestId: number, data: { reason?: string }): Promise<any> => {
    const response = await api.post(`/monthly-bills/admin/renewal-requests/${requestId}/reject`, data)
    return response.data
  },

  approveCheckout: async (requestId: number, data: { notes?: string }): Promise<any> => {
    const response = await api.post(`/monthly-bills/admin/checkout-requests/${requestId}/approve`, data)
    return response.data
  },

  rejectCheckoutRequest: async (requestId: number, data: { reason?: string }): Promise<any> => {
    const response = await api.post(`/monthly-bills/admin/checkout-requests/${requestId}/reject`, data)
    return response.data
  },

  // Admin endpoints
  createBill: async (data: {
    bookingId: number
    month: string
    rentAmount: number
    electricityAmount?: number
    extraCharges?: number
    dueDate: string
  }): Promise<MonthlyBill> => {
    const response = await api.post("/monthly-bills", data)
    return response.data.bill
  },

  getAllBills: async (filters: { status?: string, month?: string, year?: string, roomNumber?: string } = {}): Promise<MonthlyBill[]> => {
    const params = new URLSearchParams()
    if (filters.status) params.append("status", filters.status)
    if (filters.month) params.append("month", filters.month)
    if (filters.year) params.append("year", filters.year)
    if (filters.roomNumber) params.append("roomNumber", filters.roomNumber)
    const response = await api.get(`/monthly-bills/admin/all?${params}`)
    return response.data
  },

  getBillingStats: async (month?: string, year?: string): Promise<any> => {
    const params = new URLSearchParams()
    if (month) params.append("month", month)
    if (year) params.append("year", year)
    const response = await api.get(`/monthly-bills/admin/stats?${params}`)
    return response.data
  },

  updateBill: async (
    billId: number,
    data: {
      rentAmount?: number
      electricityAmount?: number
      extraCharges?: number
      dueDate?: string
    }
  ): Promise<MonthlyBill> => {
    const response = await api.put(`/monthly-bills/${billId}`, data)
    return response.data.bill
  },

  deleteBill: async (billId: number): Promise<void> => {
    await api.delete(`/monthly-bills/${billId}`)
  },
}

// ==========================================
// MESSAGES
// ==========================================
export const messagingService = {
  sendMessage: async (data: {
    bookingId: number
    receiverId: number
    content: string
  }): Promise<Message> => {
    const response = await api.post("/messages/send", data)
    return response.data.data
  },

  getConversation: async (bookingId: number): Promise<Message[]> => {
    const response = await api.get(`/messages/conversation/${bookingId}`)
    return response.data
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get("/messages/unread/count")
    return response.data.unreadCount
  },

  getAllConversations: async (): Promise<any[]> => {
    const response = await api.get("/messages/admin/conversations")
    return response.data
  },
}

// ==========================================
// PAYMENTS
// ==========================================
export const paymentService = {
  processMonthlyPayment: async (data: {
    billId: number
    paymentMethod: string
  }): Promise<Payment> => {
    const response = await api.post("/monthly-payments/process", data)
    return response.data.payment
  },

  getPaymentHistory: async (): Promise<Payment[]> => {
    const response = await api.get("/monthly-payments/history")
    return response.data
  },

  getAllPayments: async (status?: string, month?: string): Promise<Payment[]> => {
    const params = new URLSearchParams()
    if (status) params.append("status", status)
    if (month) params.append("month", month)
    const response = await api.get(`/monthly-payments/admin/all?${params}`)
    return response.data
  },

  getPaymentStats: async (): Promise<any> => {
    const response = await api.get("/monthly-payments/admin/stats")
    return response.data
  },
}
