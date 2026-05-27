import express from "express";
import { getAllElectricityBills, getElectricityBillsByRoom, createElectricityBill, updateElectricityBill, deleteElectricityBill, getPendingBillsSummary, } from "../controllers/electricityController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
const router = express.Router();
// All routes require authentication and admin access
router.use(protect, adminOnly);
// GET /api/electricity - Get all electricity bills
router.get("/", getAllElectricityBills);
// GET /api/electricity/pending - Get pending bills summary
router.get("/pending", getPendingBillsSummary);
// GET /api/electricity/room/:roomId - Get bills by room
router.get("/room/:roomId", getElectricityBillsByRoom);
// POST /api/electricity - Create new electricity bill
router.post("/", createElectricityBill);
// PUT /api/electricity/:id - Update electricity bill
router.put("/:id", updateElectricityBill);
// DELETE /api/electricity/:id - Delete electricity bill
router.delete("/:id", deleteElectricityBill);
export default router;
//# sourceMappingURL=electricityRoutes.js.map