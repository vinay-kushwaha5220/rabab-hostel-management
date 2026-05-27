import express from "express";
import { getDashboardStats, getNotifications, markNotificationRead, markAllNotificationsRead, } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
const router = express.Router();
// All dashboard routes require admin access
router.get("/stats", protect, adminOnly, getDashboardStats);
router.get("/notifications", protect, adminOnly, getNotifications);
router.put("/notifications/:id/read", protect, adminOnly, markNotificationRead);
router.put("/notifications/read-all", protect, adminOnly, markAllNotificationsRead);
export default router;
//# sourceMappingURL=dashboardRoutes.js.map