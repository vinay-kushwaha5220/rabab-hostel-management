import express from "express";
import { register, login, refreshAccessToken, logout, logoutAllDevices, getCurrentUser, getActiveSessions, } from "../controllers/authControllerV2.js";
import { protect } from "../middleware/authMiddlewareV2.js";
const router = express.Router();
// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================
// POST /api/auth/register - Register new user
router.post("/register", register);
// POST /api/auth/login - Login user
router.post("/login", login);
// POST /api/auth/refresh - Refresh access token
router.post("/refresh", refreshAccessToken);
// POST /api/auth/logout - Logout user (clear refresh token)
router.post("/logout", logout);
// ==========================================
// PROTECTED ROUTES (Authentication required)
// ==========================================
// GET /api/auth/me - Get current user
router.get("/me", protect, getCurrentUser);
// POST /api/auth/logout-all - Logout from all devices
router.post("/logout-all", protect, logoutAllDevices);
// GET /api/auth/sessions - Get all active sessions
router.get("/sessions", protect, getActiveSessions);
export default router;
//# sourceMappingURL=authRoutesV2.js.map