import express from "express"

import {
  createBooking,
  processPayment,
  getUserBookings,
  getAllBookings,
  getBookingById,
  cancelBooking,
} from "../controllers/bookingController.js"

import { protect } from "../middleware/authMiddleware.js"
import { adminOnly } from "../middleware/adminMiddleware.js"

const router = express.Router()

// Customer routes
router.post("/", protect, createBooking)
router.post("/payment", protect, processPayment)
router.get("/my-bookings", protect, getUserBookings)
router.get("/:id", protect, getBookingById)

// Admin routes
router.get("/", protect, adminOnly, getAllBookings)
router.put("/:id/cancel", protect, adminOnly, cancelBooking)

export default router
