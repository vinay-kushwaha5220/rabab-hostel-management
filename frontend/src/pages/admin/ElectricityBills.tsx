import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/apiV2"
import type { ElectricityBillType } from "../../types/electricity"

const ElectricityBills = () => {
  const navigate = useNavigate()
  const [bills, setBills] = useState<ElectricityBillType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      const response = await api.get("/electricity")
      setBills(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalPending = () => {
    return bills.filter(b => !b.isPaid).reduce((sum, b) => sum + b.amount, 0)
  }

  const getTotalPaid = () => {
    return bills.filter(b => b.isPaid).reduce((sum, b) => sum + b.amount, 0)
  }

  const filteredBills = bills.filter(bill => {
    if (filter === "paid") return bill.isPaid
    if (filter === "unpaid") return !bill.isPaid
    return true
  })

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-blue-600 hover:underline mb-2 text-sm"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Electricity Bills Management</h1>
            <p className="text-gray-600">Track monthly electricity bills for all rooms</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{bills.length}</div>
            <div className="text-sm text-gray-600">Total Bills</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-red-600">
              {bills.filter(b => !b.isPaid).length}
            </div>
            <div className="text-sm text-gray-600">Unpaid Bills</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-red-600">
              ₹{getTotalPending().toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Pending Amount</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              ₹{getTotalPaid().toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Paid</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded border border-gray-200 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded text-sm font-semibold ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              All ({bills.length})
            </button>
            <button
              onClick={() => setFilter("unpaid")}
              className={`px-4 py-2 rounded text-sm font-semibold ${filter === "unpaid" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              Unpaid ({bills.filter(b => !b.isPaid).length})
            </button>
            <button
              onClick={() => setFilter("paid")}
              className={`px-4 py-2 rounded text-sm font-semibold ${filter === "paid" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              Paid ({bills.filter(b => b.isPaid).length})
            </button>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Room</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Month</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Units (kWh)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Paid Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No electricity bills found
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tr key={bill.id} className={`hover:bg-gray-50 ${!bill.isPaid ? "bg-red-50" : ""
                      }`}>
                      <td className="px-4 py-3 text-sm">
                        {bill.room && (
                          <>
                            <div className="font-semibold text-gray-900">Room {bill.room.roomNumber}</div>
                            <div className="text-gray-600 text-xs">{bill.room.title}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {bill.month}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {bill.units}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        ₹{bill.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(bill.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${bill.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {bill.isPaid ? "PAID" : "UNPAID"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {bill.paidDate ? new Date(bill.paidDate).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {bill.notes || "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white p-4 rounded border border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {filteredBills.length} of {bills.length} bills
          </div>
        </div>
      </div>
    </div>
  )
}

export default ElectricityBills
