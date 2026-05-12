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
} from "../controllers/monthlyBillingController.js"

const router = Router()

// Renter routes
router.get("/renter/dashboard", protect, getRenterDashboardData)
router.get("/renter/bills", protect, getRenterMonthlyBills)
router.get("/:billId", protect, getMonthlyBill)

// Admin routes
router.post("/", protect, adminOnly, createMonthlyBill)
router.get("/admin/all", protect, adminOnly, getAllMonthlyBills)
router.put("/:billId", protect, adminOnly, updateMonthlyBill)
router.delete("/:billId", protect, adminOnly, deleteMonthlyBill)

export default router
