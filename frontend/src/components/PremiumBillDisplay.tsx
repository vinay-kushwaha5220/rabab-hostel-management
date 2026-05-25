import React, { useState, useEffect } from "react"
import type { MonthlyRenterType } from "../types/booking"
import Badge from "./ui/Badge"
import Button from "./ui/Button"
import Card from "./ui/Card"

const normalizeMonthlyRenterStatus = (status: string): string => {
  switch (status) {
    case "CHECKOUT_PENDING":
    case "CHECKOUT_REQUESTED":
      return "CHECKOUT_REQUESTED"
    case "RENEWAL_PENDING":
    case "PENDING_ADMIN_APPROVAL":
    case "CONTINUE_REQUESTED":
    case "STAY_CONTINUED":
    case "PENDING_PAYMENT":
      return "PAYMENT_PENDING"
    default:
      return status
  }
}

interface PremiumBillDisplayProps {
  renter: MonthlyRenterType
  onContinueStay?: () => void
  onCheckout?: () => void
  loading?: boolean
}

const PremiumBillDisplay: React.FC<PremiumBillDisplayProps> = ({
  renter,
  onContinueStay,
  onCheckout,
  loading = false,
}) => {
  const normalizedStatus = normalizeMonthlyRenterStatus(renter.status)
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [statusColor, setStatusColor] = useState("bg-green-50")
  const [statusTextColor, setStatusTextColor] = useState("text-green-700")
  const [statusIcon, setStatusIcon] = useState("✅")

  useEffect(() => {
    if (renter.currentCycleEnd) {
      const endDate = new Date(renter.currentCycleEnd)
      const now = new Date()
      const diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      setDaysRemaining(diff)
    } else {
      setDaysRemaining(null)
    }

    switch (normalizedStatus) {
      case "ACTIVE":
        setStatusColor("bg-green-50")
        setStatusTextColor("text-green-700")
        setStatusIcon("✅")
        break
      case "DUE_SOON":
      case "EXPIRES_TODAY":
      case "PAYMENT_PENDING":
        setStatusColor("bg-yellow-50")
        setStatusTextColor("text-yellow-700")
        setStatusIcon("⏰")
        break
      case "OVERDUE":
        setStatusColor("bg-red-50")
        setStatusTextColor("text-red-700")
        setStatusIcon("🔴")
        break
      case "CHECKOUT_REQUESTED":
        setStatusColor("bg-blue-50")
        setStatusTextColor("text-blue-700")
        setStatusIcon("📩")
        break
      case "CHECKED_OUT":
        setStatusColor("bg-slate-100")
        setStatusTextColor("text-slate-700")
        setStatusIcon("✔️")
        break
      default:
        setStatusColor("bg-green-50")
        setStatusTextColor("text-green-700")
        setStatusIcon("✅")
        break
    }
  }, [renter.currentCycleEnd, normalizedStatus])

  const getStatusBadge = () => {
    switch (normalizedStatus) {
      case "ACTIVE":
        return <Badge variant="success">Active</Badge>
      case "DUE_SOON":
        return <Badge variant="warning">Due Soon</Badge>
      case "EXPIRES_TODAY":
        return <Badge variant="warning">Expires Today</Badge>
      case "PAYMENT_PENDING":
        return <Badge variant="warning">Payment Pending</Badge>
      case "OVERDUE":
        return <Badge variant="danger">Overdue</Badge>
      case "CHECKOUT_REQUESTED":
        return <Badge variant="secondary">Checkout Requested</Badge>
      case "CHECKED_OUT":
        return <Badge variant="secondary">Checked Out</Badge>
      default:
        return <Badge>{normalizedStatus}</Badge>
    }
  }

  const currentCycleStart = renter.currentCycleStart ? new Date(renter.currentCycleStart) : null
  const currentCycleEnd = renter.currentCycleEnd ? new Date(renter.currentCycleEnd) : null
  const nextCycleStart = currentCycleEnd ? new Date(currentCycleEnd.getTime() + 24 * 60 * 60 * 1000) : null

  return (
    <div className="w-full space-y-4">
      {/* Main Status Card */}
      <Card className={`${statusColor} border-2 border-current`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{statusIcon}</span>
              <div>
                <h2 className={`text-2xl font-bold ${statusTextColor}`}>
                  {normalizedStatus === "CHECKED_OUT" ? "Stay Completed" : "Current Stay Status"}
                </h2>
                <p className="text-sm text-gray-600">{getStatusBadge()}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* Entry Date */}
            <div className="bg-white/50 rounded-lg p-4">
              <p className="text-xs text-gray-600 font-semibold">ENTRY DATE</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {currentCycleStart ? currentCycleStart.toLocaleDateString() : "N/A"}
              </p>
            </div>

            {/* Days Remaining */}
            <div className="bg-white/50 rounded-lg p-4">
              <p className="text-xs text-gray-600 font-semibold">DAYS REMAINING</p>
              <p
                className={`text-3xl font-bold mt-1 ${
                  daysRemaining === null
                    ? "text-slate-700"
                    : daysRemaining > 0
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {daysRemaining === null ? "Not available" : daysRemaining > 0 ? daysRemaining : "Expired"}
              </p>
              {daysRemaining !== null && daysRemaining <= 0 && (
                <p className="text-xs text-red-600 mt-1">{Math.abs(daysRemaining)} days ago</p>
              )}
            </div>

            {/* Expiry Date */}
            <div className="bg-white/50 rounded-lg p-4">
              <p className="text-xs text-gray-600 font-semibold">EXPIRY DATE</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {currentCycleEnd ? currentCycleEnd.toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Bill Breakdown Card */}
      <Card className="bg-gray-50">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Bill Breakdown</h3>

          <div className="space-y-3">
            {/* Monthly Rent */}
            <div className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-semibold text-gray-900">Monthly Rent</p>
                <p className="text-sm text-gray-600">Base accommodation charge</p>
              </div>
              <p className="text-lg font-bold text-gray-900">₹{renter.rentAmount.toLocaleString()}</p>
            </div>

            {/* Electricity Bill */}
            {renter.lastElectricityAmount > 0 && (
              <div className="flex justify-between items-center py-3 border-b">
                <div>
                  <p className="font-semibold text-gray-900">Electricity Bill</p>
                  <p className="text-sm text-gray-600">Current month consumption</p>
                </div>
                <p className="text-lg font-bold text-gray-900">₹{renter.lastElectricityAmount.toLocaleString()}</p>
              </div>
            )}

            {/* Pending Dues */}
            {renter.pendingAmount > renter.rentAmount && (
              <div className="flex justify-between items-center py-3 border-b">
                <div>
                  <p className="font-semibold text-gray-900">Previous Dues</p>
                  <p className="text-sm text-gray-600">Unpaid from earlier months</p>
                </div>
                <p className="text-lg font-bold text-red-700">
                  ₹{(renter.pendingAmount - renter.rentAmount).toLocaleString()}
                </p>
              </div>
            )}

            {/* Late Penalty */}
            {renter.latePenalty > 0 && (
              <div className="flex justify-between items-center py-3 border-b">
                <div>
                  <p className="font-semibold text-gray-900">Late Penalty</p>
                  <p className="text-sm text-gray-600">₹10/day after grace period</p>
                </div>
                <p className="text-lg font-bold text-red-700">₹{renter.latePenalty.toLocaleString()}</p>
              </div>
            )}

            {/* Total Payable */}
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg px-4 mt-4">
              <p className="text-lg font-bold text-gray-900">TOTAL PAYABLE</p>
              <p className="text-3xl font-bold text-blue-700">₹{renter.pendingAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Cycle Info Card */}
      <Card className="bg-blue-50">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Cycle Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 font-semibold">CURRENT CYCLE</p>
              <p className="text-gray-900 font-bold mt-1">
                {currentCycleStart ? currentCycleStart.toLocaleDateString() : "Not set"} to {currentCycleEnd ? currentCycleEnd.toLocaleDateString() : "Not set"}
              </p>
            </div>

            {renter.status === "RENEWAL_PENDING" && nextCycleStart && (
              <div>
                <p className="text-sm text-gray-600 font-semibold">NEXT CYCLE (if approved)</p>
                <p className="text-gray-900 font-bold mt-1">
                  {nextCycleStart.toLocaleDateString()} onwards
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600 font-semibold">DUE DATE</p>
              <p className="text-gray-900 font-bold mt-1">
                {renter.dueDate ? new Date(renter.dueDate).toLocaleDateString() : "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-semibold">STATUS</p>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
          </div>

          {typeof daysRemaining === "number" && daysRemaining > 0 && (
            <div className="mt-4 p-3 bg-white rounded-lg border-l-4 border-green-500">
              <p className="text-sm text-gray-700">
                ✅ <strong>Your stay is valid.</strong> You have {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} to
                settle payment.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons for Renewal */}
      {(renter.status === "PENDING_PAYMENT" || renter.status === "RENEWAL_PENDING") && onContinueStay && onCheckout && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400">
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Your Monthly Stay Has Expired</h3>
              <p className="text-sm text-gray-600 mt-1">
                Choose one option to proceed with your stay management
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={onContinueStay}
                disabled={loading}
                variant="primary"
                className="w-full py-3 text-base font-semibold"
              >
                {loading ? "Processing..." : "Continue Stay"}
              </Button>
              <Button
                onClick={onCheckout}
                disabled={loading}
                variant="secondary"
                className="w-full py-3 text-base font-semibold"
              >
                {loading ? "Processing..." : "Request Checkout"}
              </Button>
            </div>

            <div className="mt-4 p-3 bg-white rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Continue Stay:</strong> Renew your monthly rental for the next cycle
              </p>
              <p className="text-xs text-gray-600 mt-2">
                <strong>Checkout:</strong> Request to end your stay and vacate the room
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Awaiting Approval Card */}
      {(renter.status === "PENDING_ADMIN_APPROVAL" || renter.status === "CONTINUE_REQUESTED") && (
        <Card className="bg-blue-50 border-2 border-blue-300">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⏳</span>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Awaiting Admin Approval</h3>
                <p className="text-sm text-gray-600 mt-1">Your renewal request is pending admin review</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Overdue Warning Card */}
      {renter.status === "OVERDUE" && (
        <Card className="bg-red-50 border-2 border-red-400">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚨</span>
              <div>
                <h3 className="text-lg font-bold text-red-700">Payment Overdue</h3>
                <p className="text-sm text-red-600 mt-1">
                  Your stay expired {renter.overdueDays} day{renter.overdueDays !== 1 ? "s" : ""} ago.
                  {renter.latePenalty > 0 && ` Late penalty: ₹${renter.latePenalty}`}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default PremiumBillDisplay
