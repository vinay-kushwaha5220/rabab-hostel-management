import { Router } from "express"
import { protect, adminOnly } from "../middleware/authMiddlewareV2.js"
import {
  processMonthlyPayment,
  getPaymentHistory,
  getAllPayments,
  getPaymentStats,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/monthlyPaymentController.js"

const router = Router()

// Renter routes
router.post("/process", protect, processMonthlyPayment)
router.get("/history", protect, getPaymentHistory)
router.post("/razorpay/create-order", protect, createRazorpayOrder)
router.post("/razorpay/verify", protect, verifyRazorpayPayment)

// Admin routes
router.get("/admin/all", protect, adminOnly, getAllPayments)
router.get("/admin/stats", protect, adminOnly, getPaymentStats)

export default router
