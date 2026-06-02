import type { Request, Response } from "express"
import bcrypt from "bcryptjs"
import prisma from "../config/prisma.js"
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from "../utils/jwt.js"
import type { AuthRequest } from "../middleware/authMiddleware.js"
import { UserRole } from "@prisma/client"

// ==========================================
// REGISTER USER
// ==========================================
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email",
      })
    }

    // Always register as user (not admin)
    const userRole = UserRole.USER

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: userRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        avatar: true,
      },
    })

    console.log(`✅ User registered: ${email} (${userRole})`)

    // Generate tokens for auto-login
    const accessToken = generateAccessToken(user.id, user.role)
    const refreshToken = generateRefreshToken(user.id)

    // Get device info (optional)
    const deviceInfo = req.headers["user-agent"] || "Unknown"
    const ipAddress = req.ip || req.socket.remoteAddress || "Unknown"

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
        deviceInfo,
        ipAddress,
      },
    })

    // Set refresh token in HTTP-only cookie
    const isProduction = process.env.NODE_ENV === "production"
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // Cannot be accessed by JavaScript
      secure: isProduction, // HTTPS only in production
      sameSite: isProduction ? "none" : "lax", // Allow cross-origin cookies in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    // Return tokens and user data (auto-login)
    res.status(201).json({
      message: "Registration successful",
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error("Register error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// LOGIN USER
// ==========================================
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        message: "Account is deactivated. Please contact admin.",
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid credentials",
      })
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role)
    const refreshToken = generateRefreshToken(user.id)

    // Get device info (optional)
    const deviceInfo = req.headers["user-agent"] || "Unknown"
    const ipAddress = req.ip || req.socket.remoteAddress || "Unknown"

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
        deviceInfo,
        ipAddress,
      },
    })

    // Set refresh token in HTTP-only cookie
    const isProduction = process.env.NODE_ENV === "production"
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // Cannot be accessed by JavaScript
      secure: isProduction, // HTTPS only in production
      sameSite: isProduction ? "none" : "lax", // Allow cross-origin cookies in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    console.log(`✅ User logged in: ${email} (${user.role})`)

    // Return user data and access token
    res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// REFRESH ACCESS TOKEN
// ==========================================
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token not found",
      })
    }

    // Verify refresh token
    let decoded
    try {
      decoded = verifyRefreshToken(refreshToken)
    } catch (error) {
      return res.status(401).json({
        message: "Invalid or expired refresh token",
      })
    }

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!storedToken) {
      return res.status(401).json({
        message: "Refresh token not found in database",
      })
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      // Delete expired token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      })

      return res.status(401).json({
        message: "Refresh token expired",
      })
    }

    // Check if user is active
    if (!storedToken.user.isActive) {
      return res.status(403).json({
        message: "Account is deactivated",
      })
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(
      storedToken.user.id,
      storedToken.user.role
    )

    console.log(`✅ Access token refreshed for user: ${storedToken.user.email}`)

    res.status(200).json({
      message: "Access token refreshed",
      accessToken: newAccessToken,
    })
  } catch (error) {
    console.error("Refresh token error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// LOGOUT USER
// ==========================================
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken

    if (refreshToken) {
      // Delete refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      })
    }

    // Clear refresh token cookie
    const isProduction = process.env.NODE_ENV === "production"
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    })

    console.log(`✅ User logged out`)

    res.status(200).json({
      message: "Logout successful",
    })
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// LOGOUT FROM ALL DEVICES
// ==========================================
export const logoutAllDevices = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      })
    }

    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    })

    // Clear refresh token cookie
    const isProduction = process.env.NODE_ENV === "production"
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    })

    console.log(`✅ User logged out from all devices: ${userId}`)

    res.status(200).json({
      message: "Logged out from all devices successfully",
    })
  } catch (error) {
    console.error("Logout all devices error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET CURRENT USER
// ==========================================
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        avatar: true,
      },
    })

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    res.status(200).json({
      user,
    })
  } catch (error) {
    console.error("Get current user error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET ACTIVE SESSIONS (All devices)
// ==========================================
export const getActiveSessions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      })
    }

    const sessions = await prisma.refreshToken.findMany({
      where: { userId },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    res.status(200).json({
      sessions,
      count: sessions.length,
    })
  } catch (error) {
    console.error("Get active sessions error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// PASSWORD RESET PASSWORD & OTP SERVICE
// ==========================================

import nodemailer from "nodemailer"

// Helper function to create Nodemailer transporter dynamically with active config
const getTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPass) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASSWORD environment variables.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}

// In-memory cache for OTP codes (Expires in 10 minutes)
interface OTPSession {
  code: string
  expiresAt: Date
}
const otpCache = new Map<string, OTPSession>()

// POST /api/v2/auth/forgot-password - Send reset OTP
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        message: "Email address is required",
      })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return res.status(404).json({
        message: "No registered user found with this email address",
      })
    }

    // Generate random 6-digit code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Store in cache with 10-minute expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    otpCache.set(email.toLowerCase().trim(), { code: otpCode, expiresAt })

    // Print a high-visibility terminal banner for easy developer copy-paste & test debugging
    console.log("\n==============================================================")
    console.log("🔑 DEVELOPER OTP TEST BANNER")
    console.log(`👤 Recipient: ${email}`)
    console.log(`⚡ OTP Code:  ${otpCode}`)
    console.log("==============================================================\n")

    let emailSent = false
    try {
      const mailTransporter = getTransporter()
      await mailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email.toLowerCase().trim(),
        subject: `Your Password Reset Verification OTP [${otpCode}] - Rabab Stay`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #fafbfc; color: #1e293b;">
            <h2 style="color: #2563eb; text-align: center; margin-bottom: 24px; font-weight: 800;">Rabab Stay Co-Living</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">Hello,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">We received a request to recover your account password. Use the following 6-digit One-Time Password (OTP) to verify your identity and finalize your password reset. This code is valid for <strong>10 minutes</strong>.</p>
            <div style="background-color: #eff6ff; border: 1px dashed #bfdbfe; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
              <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; font-family: monospace;">${otpCode}</span>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px;">If you did not make this request, you can safely disregard this message. Your password will remain unchanged.</p>
          </div>
        `,
      })
      emailSent = true
      console.log(`✉️ Recovery OTP successfully dispatched to email: ${email}`)
    } catch (mailError: any) {
      console.error("❌ Failed to dispatch SMTP email:", mailError.message)
      console.log("ℹ️ Dev Mode fallback active: OTP was logged to the terminal successfully. Continuing recovery process.")
    }

    res.status(200).json({
      message: emailSent
        ? "Verification OTP code has been dispatched to your email"
        : "Verification OTP code has been logged to the terminal console! (SMTP bypass active)",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({
      message: "Failed to dispatch recovery email. Please verify connection credentials.",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// POST /api/v2/auth/verify-otp - Check reset OTP
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP verification code are required",
      })
    }

    const session = otpCache.get(email.toLowerCase().trim())

    if (!session) {
      return res.status(400).json({
        message: "No active recovery request found or OTP has expired",
      })
    }

    if (session.code !== otp.trim()) {
      return res.status(400).json({
        message: "Invalid verification code",
      })
    }

    if (new Date() > session.expiresAt) {
      otpCache.delete(email.toLowerCase().trim())
      return res.status(400).json({
        message: "Verification OTP code has expired",
      })
    }

    res.status(200).json({
      message: "OTP successfully verified",
      success: true,
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    res.status(500).json({
      message: "Server verification error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// POST /api/v2/auth/reset-password - Reset password using OTP
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP code, and new password are required",
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      })
    }

    const session = otpCache.get(email.toLowerCase().trim())

    if (!session) {
      return res.status(400).json({
        message: "No active recovery request found or OTP has expired",
      })
    }

    if (session.code !== otp.trim()) {
      return res.status(400).json({
        message: "Invalid verification code",
      })
    }

    if (new Date() > session.expiresAt) {
      otpCache.delete(email.toLowerCase().trim())
      return res.status(400).json({
        message: "Verification OTP code has expired",
      })
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user password in Prisma database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Clean up OTP cache session
    otpCache.delete(email.toLowerCase().trim())

    console.log(`✅ Password successfully reset for user: ${email}`)

    // Send confirmation email of password reset to notify the user
    try {
      const mailTransporter = getTransporter()
      await mailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email.toLowerCase().trim(),
        subject: "Your Password Has Been Reset Successfully - Rabab Stay",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #fafbfc; color: #1e293b;">
            <h2 style="color: #2563eb; text-align: center; margin-bottom: 24px; font-weight: 800;">Rabab Stay Co-Living</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">Hello,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">This is to confirm that the password for your Rabab Stay account <strong>${email.toLowerCase().trim()}</strong> was successfully changed.</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">If you did not make this change, please contact our support team immediately.</p>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px;">Best regards,<br>Rabab Stay Team</p>
          </div>
        `,
      })
      console.log(`✉️ Password reset confirmation email successfully sent to: ${email}`)
    } catch (mailError: any) {
      console.error("❌ Failed to send password reset confirmation email:", mailError.message)
    }

    res.status(200).json({
      message: "Your password has been successfully reset. You can now log in.",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({
      message: "Server password reset error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// UPDATE PROFILE DETAILS (PROTECTED)
// ==========================================
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    // TEMPORARY PRODUCTION LOGGING
    console.log("[DEBUG /profile] Request Content-Type:", req.headers["content-type"])
    console.log("[DEBUG /profile] Request body:", req.body)
    console.log("[DEBUG /profile] Request file:", req.file)

    const body = req.body || {}
    const { name, phone, removeAvatar } = body

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      })
    }

    // Build update data object dynamically
    const updateData: {
      name?: string;
      phone?: string | null;
      avatar?: string | null;
    } = {}

    if (name !== undefined) {
      if (!name) {
        return res.status(400).json({
          message: "Name is required",
        })
      }
      updateData.name = name
    }

    if (phone !== undefined) {
      updateData.phone = phone || null
    }

    // Process avatar update
    let avatarUpdate: string | null | undefined = undefined
    if (req.file) {
      const base64Image = req.file.buffer.toString("base64")
      avatarUpdate = `data:${req.file.mimetype};base64,${base64Image}`
    } else if (removeAvatar === "true") {
      avatarUpdate = null
    } else if (body.avatar !== undefined) {
      avatarUpdate = body.avatar
    }

    if (avatarUpdate !== undefined) {
      updateData.avatar = avatarUpdate
    }

    // If there is nothing to update, just return current user details
    if (Object.keys(updateData).length === 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          avatar: true,
        }
      })
      return res.status(200).json({
        message: "Profile updated successfully",
        user,
      })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        avatar: true,
      }
    })

    console.log(`✅ User profile updated: ${updatedUser.email}`)

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
