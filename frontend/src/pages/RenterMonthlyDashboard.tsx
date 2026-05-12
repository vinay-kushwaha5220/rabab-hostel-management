import { useEffect, useState } from "react"
import { billingService, messagingService, paymentService } from "../services/billingService"
import type { RenterDashboardData } from "../types/billing"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import Badge from "../components/ui/Badge"

const RenterMonthlyDashboard = () => {
  const [data, setData] = useState<RenterDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [messageContent, setMessageContent] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const dashboardData = await billingService.getRenterDashboard()
      setData(dashboardData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !data?.activeBooking) return

    try {
      setSendingMessage(true)
      // Get admin user (assuming admin ID is 1 or we need to fetch it)
      const adminId = 1 // This should be fetched from backend
      await messagingService.sendMessage({
        bookingId: data.activeBooking.id,
        receiverId: adminId,
        content: messageContent,
      })
      setMessageContent("")
      await fetchDashboardData()
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handlePayment = async () => {
    if (!paymentMethod || !data?.monthlyBill) return

    try {
      setProcessingPayment(true)
      await paymentService.processMonthlyPayment({
        billId: data.monthlyBill.id,
        paymentMethod,
      })
      setPaymentMethod("")
      await fetchDashboardData()
    } catch (error) {
      console.error("Error processing payment:", error)
    } finally {
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading dashboard..." />
      </div>
    )
  }

  if (!data?.activeBooking) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Active Booking</h2>
            <p className="text-gray-600">You don't have any active monthly bookings.</p>
          </Card>
        </div>
      </div>
    )
  }

  const { activeBooking, monthlyBill, messages, notifications } = data

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Monthly Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Room & Billing Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Details */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Room Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Room Number</p>
                  <p className="text-lg font-semibold text-gray-900">{activeBooking.room.roomNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Floor</p>
                  <p className="text-lg font-semibold text-gray-900">{activeBooking.room.floor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <Badge variant={activeBooking.room.roomType === "AC" ? "info" : "secondary"}>
                    {activeBooking.room.roomType}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Check-in Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(activeBooking.checkInDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>

            {/* Monthly Bill */}
            {monthlyBill ? (
              <Card className="p-6 border-2 border-blue-200">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Monthly Bill</h2>
                  <Badge variant={monthlyBill.isPaid ? "success" : "danger"}>
                    {monthlyBill.isPaid ? "Paid" : "Pending"}
                  </Badge>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Month</span>
                    <span className="font-semibold text-gray-900">{monthlyBill.month}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rent Amount</span>
                    <span className="font-semibold text-gray-900">₹{monthlyBill.rentAmount.toLocaleString()}</span>
                  </div>
                  {monthlyBill.electricityAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Electricity Bill</span>
                      <span className="font-semibold text-gray-900">₹{monthlyBill.electricityAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {monthlyBill.extraCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Extra Charges</span>
                      <span className="font-semibold text-gray-900">₹{monthlyBill.extraCharges.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-bold text-gray-900">Total Due</span>
                    <span className="text-2xl font-bold text-blue-600">₹{monthlyBill.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(monthlyBill.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {!monthlyBill.isPaid && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select payment method</option>
                        <option value="card">Credit/Debit Card</option>
                        <option value="upi">UPI</option>
                        <option value="online">Net Banking</option>
                        <option value="cash">Cash at Office</option>
                      </select>
                    </div>
                    <Button
                      onClick={handlePayment}
                      className="w-full"
                      size="lg"
                      isLoading={processingPayment}
                      disabled={!paymentMethod || processingPayment}
                    >
                      Pay ₹{monthlyBill.totalAmount.toLocaleString()}
                    </Button>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-gray-600">No monthly bill added yet.</p>
              </Card>
            )}

            {/* Messages Section */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>

              {/* Message History */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-600">No messages yet</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.senderId === activeBooking.userId
                          ? "bg-blue-100 ml-8"
                          : "bg-gray-200 mr-8"
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        {msg.sender?.name || "Admin"}
                      </p>
                      <p className="text-gray-800">{msg.content}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSendMessage()
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  isLoading={sendingMessage}
                  disabled={!messageContent.trim() || sendingMessage}
                >
                  Send
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column - Notifications */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Notifications</h2>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-600">No notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <p className="font-semibold text-gray-900 text-sm">{notif.title}</p>
                      <p className="text-gray-700 text-sm mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-600 mt-2">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RenterMonthlyDashboard
