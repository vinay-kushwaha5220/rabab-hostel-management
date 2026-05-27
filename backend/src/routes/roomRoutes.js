import express from "express";
import { createRoom, getRooms, getSingleRoom, updateRoom, deleteRoom, } from "../controllers/roomController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
const router = express.Router();
// Public routes
router.get("/", getRooms);
router.get("/:id", getSingleRoom);
// Admin routes
router.post("/", protect, adminOnly, createRoom);
router.put("/:id", protect, adminOnly, updateRoom);
router.delete("/:id", protect, adminOnly, deleteRoom);
export default router;
//# sourceMappingURL=roomRoutes.js.map