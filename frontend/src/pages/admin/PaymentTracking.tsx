import { useEffect, useState } from "react"
import { paymentService } from "../../services/billingService"
import type { Payment } from "../../types/billing"
import LoadingSpinner from "../../components/ui/LoadingSpinner"
import Card from "../../components/ui/Card"
import Badge from "../../components/ui/Badge"

interface PaymentStats {
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  totalPayments: number
  paidPayments: number
  pendingPayments: number
}

const PaymentTracking = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [monthFilter, setMonthFilter] = useState<string>("")
  const [error, setError] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    fetchPaymentData()
    setCurrentPage(1)
  }, [statusFilter, monthFilter])

  const fetchPaymentData = async () => {
    try {
      setLoading(true)
      const [paymentsData, statsData] = await Promise.all([
        paymentService.getAllPayments(statusFilter || undefined, monthFilter || undefined),
        paymentService.getPaymentStats(),
      ])
      setPayments(paymentsData)
      setStats(statsData)
      setError("")
    } catch (err) {
      setError("Failed to fetch payment data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return "success"
      case "pending":
        return "warning"
      case "failed":
        return "danger"
      default:
        return "secondary"
    }
  }

  const getPaymentStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const totalPages = Math.ceil(payments.length / ITEMS_PER_PAGE)
  const paginatedPayments = payments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Payment Tracking</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Amount</h3>
              <p className="text-3xl font-bold text-gray-900">₹{stats.totalAmount.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-2">{stats.totalPayments} transactions</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Paid Amount</h3>
              <p className="text-3xl font-bold text-green-600">₹{stats.paidAmount.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-2">{stats.paidPayments} payments</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Pending Amount</h3>
              <p className="text-3xl font-bold text-orange-600">₹{stats.pendingAmount.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-2">{stats.pendingPayments} payments</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Collection Rate</h3>
              <p className="text-3xl font-bold text-blue-600">
                {stats.totalAmount > 0
                  ? ((stats.paidAmount / stats.totalAmount) * 100).toFixed(1)
                  : 0}
                %
              </p>
              <p className="text-xs text-gray-500 mt-2">of total amount</p>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </Card>

        {/* Payments Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading payments..." />
          </div>
        ) : payments.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 text-lg">No payments found</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Payment ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{payment.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{payment.bookingId}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ₹{payment.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payment.paymentMethod.charAt(0).toUpperCase() +
                          payment.paymentMethod.slice(1)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {payment.transactionId || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge variant={getPaymentStatusColor(payment.paymentStatus)}>
                          {getPaymentStatusText(payment.paymentStatus)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, payments.length)}</span> of <span className="font-medium">{payments.length}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

export default PaymentTracking
