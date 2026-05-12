import type { Request, Response } from "express"
import prisma from "../config/prisma.js"
import type { AuthRequest } from "../middleware/authMiddleware.js"

// ==========================================
// SEND MESSAGE
// ==========================================
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, receiverId, content } = req.body
    const senderId = req.userId

    if (!bookingId || !receiverId || !content) {
      return res.status(400).json({
        message: "bookingId, receiverId, and content are required",
      })
    }

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      })
    }

    // Check authorization
    if (booking.userId !== senderId) {
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
      })
      if (sender?.role !== "admin") {
        return res.status(403).json({
          message: "Unauthorized",
        })
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        bookingId,
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: true,
        receiver: true,
      },
    })

    console.log(`✅ Message sent from ${senderId} to ${receiverId}`)

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    })
  } catch (error) {
    console.error("Send message error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET CONVERSATION
// ==========================================
export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params
    const userId = req.userId

    // Check authorization
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
    })

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      })
    }

    if (booking.userId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })
      if (user?.role !== "admin") {
        return res.status(403).json({
          message: "Unauthorized",
        })
      }
    }

    // Get all messages for this booking
    const messages = await prisma.message.findMany({
      where: {
        bookingId: parseInt(bookingId),
      },
      include: {
        sender: true,
        receiver: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        bookingId: parseInt(bookingId),
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    res.status(200).json(messages)
  } catch (error) {
    console.error("Get conversation error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET UNREAD MESSAGE COUNT
// ==========================================
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    })

    res.status(200).json({
      unreadCount,
    })
  } catch (error) {
    console.error("Get unread count error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET ALL CONVERSATIONS (Admin)
// ==========================================
export const getAllConversations = async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await prisma.booking.findMany({
      where: {
        status: "confirmed",
      },
      include: {
        user: true,
        room: true,
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.status(200).json(conversations)
  } catch (error) {
    console.error("Get all conversations error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
