import { useEffect, useState } from "react"
import api from "../services/apiV2"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import Card from "../components/ui/Card"
import Badge from "../components/ui/Badge"

interface Payment {
  id: number
  amount: number
  paymentMethod: string
  transactionId: string
  paymentStatus: string
  createdAt: string
}

const PaymentHistoryPage = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPaymentHistory()
  }, [])

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true)
      const response = await api.get("/monthly-payments/history")
      setPayments(response.data)
    } catch (error) {
      console.error("Error fetching payment history:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading payment history..." />
      </div>
    )
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Payment History</h1>
        <p className="text-xs text-gray-400 font-medium mt-1">View all your past transactions</p>
      </div>

      {/* Summary Card */}
      <Card className="p-4 mb-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-none shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Paid</p>
            <p className="text-2xl font-black text-gray-900 mt-1">₹{totalPaid.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transactions</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{payments.length}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Activity</p>
            <p className="text-base font-bold text-gray-700 mt-1">
              {payments.length > 0
                ? new Date(payments[0].createdAt).toLocaleDateString()
                : "None"}
            </p>
          </div>
        </div>
      </Card>

      {/* Payments Table */}
      {payments.length > 0 ? (
        <Card className="overflow-hidden border-gray-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Method</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ref ID</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-medium text-gray-600">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-900">
                      ₹{payment.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 capitalize">
                      {payment.paymentMethod?.toLowerCase()}
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-gray-400">
                      {payment.transactionId || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <Badge variant={payment.paymentStatus === "SUCCESS" ? "success" : "warning"} size="sm">
                        {payment.paymentStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 text-lg font-medium">No payments yet</p>
          <p className="text-gray-500 text-sm mt-2">Your payment history will appear here</p>
        </Card>
      )}
    </div>
  )
}

export default PaymentHistoryPage
