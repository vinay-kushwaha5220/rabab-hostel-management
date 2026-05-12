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
    const userRole = "user"

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
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // Cannot be accessed by JavaScript
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict", // CSRF protection
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
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // Cannot be accessed by JavaScript
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict", // CSRF protection
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
    res.clearCookie("refreshToken")

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
    res.clearCookie("refreshToken")

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
