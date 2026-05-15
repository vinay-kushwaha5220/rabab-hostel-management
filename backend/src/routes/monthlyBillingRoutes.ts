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
} from "../controllers/monthlyBillingController.js"

const router = Router()

// Admin routes - temporarily removed middleware for debugging 404
router.post("/", createMonthlyBill)
router.get("/admin/all", protect, adminOnly, getAllMonthlyBills)
router.get("/admin/stats", protect, adminOnly, getAdminBillingStats)
router.get("/admin/room-history/:roomId", protect, adminOnly, getRoomBillingHistory)
router.post("/admin/generate-bulk", protect, adminOnly, generateBulkMonthlyBills)

// Renter routes - specific paths
router.get("/renter/dashboard", protect, getRenterDashboardData)
router.get("/renter/bills", protect, getRenterMonthlyBills)
router.get("/test", (req, res) => {
  res.json({
    message: "Monthly billing route working",
  })
})

// Generic routes - parameter routes last
router.get("/:billId", protect, getMonthlyBill)
router.put("/:billId", protect, adminOnly, updateMonthlyBill)
router.delete("/:billId", protect, adminOnly, deleteMonthlyBill)
router.put("/:billId/verify", protect, adminOnly, verifyMonthlyPayment)

export default router
