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
} from "../controllers/bookingController.js"

import { protect } from "../middleware/authMiddleware.js"
import { adminOnly } from "../middleware/adminMiddleware.js"

const router = express.Router()

// Customer routes
router.post("/", protect, createBooking)
router.post("/payment", protect, processPayment)
router.get("/my-bookings", protect, getUserBookings)

// Admin routes
router.get("/monthly-active", protect, adminOnly, getMonthlyActiveBookings)
router.get("/", protect, adminOnly, getAllBookings)
router.put("/:id/cancel", protect, adminOnly, cancelBooking)
router.put("/:id/confirm", protect, adminOnly, confirmBooking)

// Detail routes - Generic parameters MUST be last to avoid catching static routes
router.get("/:id", protect, getBookingById)

export default router
