import type {
  Response,
  NextFunction,
} from "express"

import prisma from "../config/prisma.js"

import type { AuthRequest } from "./authMiddleware.js"

export const adminOnly = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.userId!,
      },
    })

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access only",
      })
    }

    next()
  } catch (error) {
    console.error("Admin middleware error:", error)
    return res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}