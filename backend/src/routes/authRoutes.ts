import express from "express"
import { protect } from "../middleware/authMiddleware.js"
import {
  registerUser,
  loginUser,
  getCurrentUser,
} from "../controllers/authController.js"

const router = express.Router()

router.post("/register", registerUser)

router.post("/login", loginUser)

router.get("/me", protect, getCurrentUser)

export default router