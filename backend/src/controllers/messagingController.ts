import type { Request, Response } from "express"
import prisma from "../config/prisma.js"
import type { AuthRequest } from "../middleware/authMiddleware.js"
import { NotificationType, UserRole, BookingStatus } from "@prisma/client"

// ==========================================
// SEND MESSAGE
// ==========================================
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, receiverId, content } = req.body
    const senderId = req.userId

    if (!senderId) {
      return res.status(401).json({
        message: "Unauthorized - User session not found",
      })
    }

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
      if (sender?.role !== UserRole.ADMIN) {
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

    // Create notification for the receiver
    await prisma.notification.create({
      data: {
        bookingId,
        title: message.sender.role === UserRole.ADMIN ? "New Message from Admin" : `New Message from ${message.sender.name}`,
        message: content.length > 50 ? content.substring(0, 47) + "..." : content,
        type: NotificationType.MESSAGE,
      },
    })

    console.log(`✅ Message sent and notification created for ${receiverId}`)

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
  console.log("🔍 getConversation Params:", req.params)
  try {
    const { bookingId } = req.params
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - User session not found",
      })
    }

    // Handle both numeric ID and string Booking Code (e.g., RBS-2026-0001)
    const isNumeric = !isNaN(Number(bookingId))
    
    console.log(`🔍 Fetching conversation for: ${bookingId} (Type: ${isNumeric ? 'Numeric' : 'Code'})`)

    const conversation = await prisma.booking.findFirst({
      where: isNumeric 
        ? { id: Number(bookingId) }
        : { bookingId: String(bookingId) },
      include: {
        messages: {
          include: {
            sender: {
              select: { name: true },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    })

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" })
    }

    // Check authorization
    if (conversation.userId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })
      if (user?.role !== UserRole.ADMIN) {
        return res.status(403).json({
          message: "Unauthorized",
        })
      }
    }

    // Mark messages as read for THIS specific conversation
    await prisma.message.updateMany({
      where: {
        bookingId: conversation.id,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    res.status(200).json(conversation.messages)
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

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - User session not found",
      })
    }

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
        status: BookingStatus.CONFIRMED,
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

    const formattedConversations = conversations.map((convo) => {
      const latestMsg = convo.messages[0]

      return {
        bookingId: convo.id, // Numeric ID for API calls
        bookingCode: convo.bookingId, // String code for display
        renterName: convo.user.name,
        renterId: convo.userId,
        latestMessage: latestMsg ? latestMsg.content : "No messages yet",
        latestMessageTime: latestMsg ? latestMsg.createdAt : convo.createdAt,
        unreadCount: 0, // Simplified for now
      }
    })

    res.status(200).json(formattedConversations)
  } catch (error) {
    console.error("Get all conversations error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
