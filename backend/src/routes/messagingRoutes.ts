import { Router } from "express"
import { protect, adminOnly } from "../middleware/authMiddlewareV2.js"
import {
  sendMessage,
  getConversation,
  getUnreadCount,
  getAllConversations,
} from "../controllers/messagingController.js"

const router = Router()

// Message routes
router.post("/send", protect, sendMessage)
router.get("/conversation/:bookingId", protect, getConversation)
router.get("/unread/count", protect, getUnreadCount)

// Admin routes
router.get("/admin/conversations", protect, adminOnly, getAllConversations)

export default router
