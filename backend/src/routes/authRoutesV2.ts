import express from "express"
import multer from "multer"
import {
  register,
  login,
  refreshAccessToken,
  logout,
  logoutAllDevices,
  getCurrentUser,
  getActiveSessions,
  forgotPassword,
  verifyOtp,
  resetPassword,
  updateProfile,
} from "../controllers/authControllerV2.js"
import { protect } from "../middleware/authMiddlewareV2.js"

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================

// POST /api/auth/register - Register new user
router.post("/register", register)

// POST /api/auth/login - Login user
router.post("/login", login)

// POST /api/auth/refresh - Refresh access token
router.post("/refresh", refreshAccessToken)

// POST /api/auth/logout - Logout user (clear refresh token)
router.post("/logout", logout)

// POST /api/auth/forgot-password - Send reset OTP
router.post("/forgot-password", forgotPassword)

// POST /api/auth/verify-otp - Check reset OTP
router.post("/verify-otp", verifyOtp)

// POST /api/auth/reset-password - Reset password using OTP
router.post("/reset-password", resetPassword)

// ==========================================
// PROTECTED ROUTES (Authentication required)
// ==========================================

// GET /api/auth/me - Get current user
router.get("/me", protect, getCurrentUser)

// POST /api/auth/logout-all - Logout from all devices
router.post("/logout-all", protect, logoutAllDevices)

// GET /api/auth/sessions - Get all active sessions
router.get("/sessions", protect, getActiveSessions)

// PUT /api/auth/profile - Update user profile (Name and Phone)
router.put("/profile", protect, upload.single("avatar"), updateProfile)

export default router
