import { Router } from "express"
import { protect, adminOnly } from "../middleware/authMiddlewareV2.js"
import {
  createMonthlyBill,
  getMonthlyBill,
  getRenterMonthlyBills,
  getAllMonthlyBills,
  updateMonthlyBill,
  deleteMonthlyBill,
  getRenterDashboardData,
  verifyMonthlyPayment,
  getAdminBillingStats,
  getRoomBillingHistory,
  generateBulkMonthlyBills,
  requestStayRenewal,
  sendRenterReminder,
  triggerMonthlyReminders,
  requestRenterCheckout,
  rejectRenterCheckout,
  // New renewal lifecycle endpoints
  requestContinueStay,
  requestCheckout,
  getPendingRenewalRequests,
  approveContinueStay,
  rejectContinueStay,
  approveCheckout,
  rejectCheckout,
  sendMonthlyInvoice,
} from "../controllers/monthlyBillingController.js"

const router = Router()

// Admin routes
router.post("/", createMonthlyBill)
router.get("/admin/all", protect, adminOnly, getAllMonthlyBills)
router.get("/admin/stats", protect, adminOnly, getAdminBillingStats)
router.get("/admin/room-history/:roomId", protect, adminOnly, getRoomBillingHistory)
router.post("/admin/generate-bulk", protect, adminOnly, generateBulkMonthlyBills)
router.post("/admin/trigger-reminders", protect, adminOnly, triggerMonthlyReminders)
router.post("/admin/send-reminder/:bookingId", protect, adminOnly, sendRenterReminder)
router.post("/admin/reject-checkout/:bookingId", protect, adminOnly, rejectRenterCheckout)
router.post("/admin/send-invoice/:billId", protect, adminOnly, sendMonthlyInvoice)

// Professional Renewal Lifecycle - Admin
router.get("/admin/renewal-requests", protect, adminOnly, getPendingRenewalRequests)
router.post("/admin/renewal-requests/:requestId/approve", protect, adminOnly, approveContinueStay)
router.post("/admin/renewal-requests/:requestId/reject", protect, adminOnly, rejectContinueStay)
router.post("/admin/checkout-requests/:requestId/approve", protect, adminOnly, approveCheckout)
router.post("/admin/checkout-requests/:requestId/reject", protect, adminOnly, rejectCheckout)

// Renter routes
router.get("/renter/dashboard", protect, getRenterDashboardData)
router.get("/renter/bills", protect, getRenterMonthlyBills)
router.post("/renter/renew", protect, requestStayRenewal) // Legacy
router.post("/renter/request-checkout", protect, requestRenterCheckout) // Legacy

// Professional Renewal Lifecycle - Renter
router.post("/renter/continue-stay", protect, requestContinueStay)
router.post("/renter/checkout", protect, requestCheckout)

// Generic routes - parameter routes last
router.get("/:billId", protect, getMonthlyBill)
router.put("/:billId", protect, adminOnly, updateMonthlyBill)
router.delete("/:billId", protect, adminOnly, deleteMonthlyBill)
router.put("/:billId/verify", protect, adminOnly, verifyMonthlyPayment)
router.get("/test", (req, res) => {
  res.json({
    message: "Monthly billing route working",
  })
})

export default router
