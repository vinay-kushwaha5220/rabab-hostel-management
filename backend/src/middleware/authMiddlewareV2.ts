import type { Request, Response, NextFunction } from "express"
import { verifyAccessToken } from "../utils/jwt.js"

// Extend Express Request type to include userId and userRole
export interface AuthRequest extends Request {
  userId?: number
  userRole?: string
}

// ==========================================
// PROTECT MIDDLEWARE - Verify Access Token
// ==========================================
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided. Authorization denied.",
      })
    }

    // Extract token
    const token = authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        message: "No token provided. Authorization denied.",
      })
    }

    // Verify access token
    try {
      const decoded = verifyAccessToken(token)
      console.log("🔍 DEBUG: Decoded token:", decoded)

      // Attach user info to request
      req.userId = decoded.userId
      req.userRole = decoded.role

      next()
    } catch (error) {
      console.error("❌ Token verification failed:", error)
      return res.status(401).json({
        message: "Invalid or expired token. Please refresh your token.",
        code: "TOKEN_EXPIRED",
      })
    }
  } catch (error) {
    console.error("Auth middleware error:", error)
    return res.status(500).json({
      message: "Server error in authentication",
    })
  }
}

// ==========================================
// ADMIN ONLY MIDDLEWARE
// ==========================================
export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("🔍 DEBUG adminOnly - Role:", req.userRole)
  if (req.userRole !== "ADMIN") {
    return res.status(403).json({
      message: "Access denied. Admin only.",
    })
  }
  next()
}

// ==========================================
// USER/RENTER ONLY MIDDLEWARE
// ==========================================
export const renterOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("🔍 DEBUG renterOnly - Role:", req.userRole)
  if (req.userRole !== "USER") {
    return res.status(403).json({
      message: "Access denied. Renter/User only.",
    })
  }
  next()
}

// ==========================================
// ADMIN OR OWNER MIDDLEWARE
// (Admin can access, or user can access their own data)
// ==========================================
export const adminOrOwner = (resourceUserIdParam: string = "id") => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const resourceUserId = parseInt(req.params[resourceUserIdParam] as string)
    console.log(`🔍 DEBUG adminOrOwner - User: ${req.userId}, Role: ${req.userRole}, Target: ${resourceUserId}`)
    
    // Allow if admin
    if (req.userRole === "ADMIN") {
      return next()
    }

    // Allow if user is accessing their own resource
    if (req.userId === resourceUserId) {
      return next()
    }

    return res.status(403).json({
      message: "Access denied. You can only access your own resources.",
    })
  }
}
