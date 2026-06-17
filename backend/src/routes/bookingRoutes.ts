import express from "express"

import {
  createBooking,
  processPayment,
  getUserBookings,
  getAllBookings,
  getMonthlyActiveBookings,
  getBookingById,
  cancelBooking,
  confirmBooking,
  checkInBooking,
  checkOutBooking,
  refundBooking,
  undoCheckOutBooking,
  renewMonthlyStay,
  checkExtensionAvailability,
  extendDailyBooking,
  deleteBooking,
  recordPayment,
  deletePayment,
  updateDeposit,
} from "../controllers/bookingController.js"

import { protect } from "../middleware/authMiddleware.js"
import { adminOnly } from "../middleware/adminMiddleware.js"

const router = express.Router()

// Customer routes
router.post("/", protect, createBooking)
router.post("/payment", protect, processPayment)
router.get("/my-bookings", protect, getUserBookings)
router.post("/:id/extend-check", protect, checkExtensionAvailability)
router.post("/:id/extend", protect, extendDailyBooking)

// Admin routes
router.get("/monthly-active", protect, adminOnly, getMonthlyActiveBookings)
router.get("/", protect, adminOnly, getAllBookings)
router.put("/:id/cancel", protect, adminOnly, cancelBooking)
router.put("/:id/confirm", protect, adminOnly, confirmBooking)
router.put("/:id/check-in", protect, adminOnly, checkInBooking)
router.put("/:id/check-out", protect, adminOnly, checkOutBooking)
router.put("/:id/refund", protect, adminOnly, refundBooking)
router.put("/:id/undo-checkout", protect, adminOnly, undoCheckOutBooking)
router.put("/:id/renew-stay", protect, adminOnly, renewMonthlyStay)
router.put("/:id/deposit", protect, adminOnly, updateDeposit)

// New stay/payment admin control endpoints
router.post("/:id/payment", protect, adminOnly, recordPayment)
router.delete("/payment/:paymentId", protect, adminOnly, deletePayment)
router.delete("/:id", protect, adminOnly, deleteBooking)

// Detail routes - Generic parameters MUST be last to avoid catching static routes
router.get("/:id", protect, getBookingById)

export default router
