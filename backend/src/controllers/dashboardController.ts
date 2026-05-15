import type { Response } from "express"
import prisma from "../config/prisma.js"
import type { AuthRequest } from "../middleware/authMiddleware.js"
import { RoomType, BookingStatus, PaymentStatus } from "@prisma/client"

// ==========================================
// GET DASHBOARD STATS
// ==========================================
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response
) => {
  console.log("🔍 DEBUG: getDashboardStats Request Received")
  try {
    // Total rooms
    const totalRooms = await prisma.room.count()

    // Available rooms
    const availableRooms = await prisma.room.count({
      where: { isAvailable: true },
    })

    // Booked rooms
    const bookedRooms = totalRooms - availableRooms

    // AC rooms
    const acRooms = await prisma.room.count({
      where: { roomType: RoomType.AC },
    })
    
    // Non-AC rooms
    const nonAcRooms = await prisma.room.count({
      where: { roomType: RoomType.NON_AC },
    })

    // Total earnings (all paid bookings)
    const totalEarningsData = await prisma.payment.aggregate({
      where: { paymentStatus: PaymentStatus.SUCCESS },
      _sum: { amount: true },
    })
    const totalEarnings = totalEarningsData._sum.amount || 0

    // Monthly earnings (current month)
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const monthlyEarningsData = await prisma.payment.aggregate({
      where: {
        paymentStatus: PaymentStatus.SUCCESS,
        createdAt: { gte: currentMonth },
      },
      _sum: { amount: true },
    })
    const monthlyEarnings = monthlyEarningsData._sum.amount || 0

    // Total bookings
    const totalBookings = await prisma.booking.count()

    // Pending bookings
    const pendingBookings = await prisma.booking.count({
      where: { status: BookingStatus.PENDING },
    })

    // Confirmed bookings
    const confirmedBookings = await prisma.booking.count({
      where: { status: BookingStatus.CONFIRMED },
    })

    // Recent bookings (last 10)
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        room: {
          select: {
            roomNumber: true,
            title: true,
            roomType: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Unread notifications
    const unreadNotifications = await prisma.notification.count({
      where: { isRead: false },
    })

    const stats = {
      rooms: {
        total: totalRooms,
        available: availableRooms,
        booked: bookedRooms,
        ac: acRooms,
        nonAc: nonAcRooms,
      },
      earnings: {
        total: totalEarnings,
        monthly: monthlyEarnings,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
      },
      recentBookings,
      unreadNotifications,
    }

    console.log("✅ DEBUG: Dashboard Stats compiled successfully")
    res.status(200).json(stats)
  } catch (error: any) {
    console.error("❌ ERROR in getDashboardStats:", error)
    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    })
  }
}

// ==========================================
// GET NOTIFICATIONS
// ==========================================
export const getNotifications = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const notifications = await prisma.notification.findMany({
      include: {
        booking: {
          include: {
            room: {
              select: {
                roomNumber: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Last 50 notifications
    })

    res.status(200).json(notifications)
  } catch (error) {
    console.error("Get notifications error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// MARK NOTIFICATION AS READ
// ==========================================
export const markNotificationRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params

    await prisma.notification.update({
      where: { id: Number(id) },
      data: { isRead: true },
    })

    res.status(200).json({
      message: "Notification marked as read",
    })
  } catch (error) {
    console.error("Mark notification read error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// ==========================================
export const markAllNotificationsRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    })

    res.status(200).json({
      message: "All notifications marked as read",
    })
  } catch (error) {
    console.error("Mark all notifications read error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
