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
    // Current month start
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    // Execute all independent queries concurrently in a single Promise.all batch
    const [
      rooms,
      totalEarningsData,
      monthlyEarningsData,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      recentBookings,
      unreadNotifications
    ] = await Promise.all([
      // Query 1: Get all rooms (we'll calculate occupancy, availability and types in-memory)
      prisma.room.findMany(),

      // Query 2: Aggregate total earnings
      prisma.payment.aggregate({
        where: { paymentStatus: PaymentStatus.SUCCESS },
        _sum: { amount: true },
      }),

      // Query 3: Aggregate current month's earnings
      prisma.payment.aggregate({
        where: {
          paymentStatus: PaymentStatus.SUCCESS,
          createdAt: { gte: currentMonth },
        },
        _sum: { amount: true },
      }),

      // Query 4: Total bookings count
      prisma.booking.count(),

      // Query 5: Pending bookings count
      prisma.booking.count({
        where: { status: BookingStatus.PENDING },
      }),

      // Query 6: Confirmed bookings count
      prisma.booking.count({
        where: { status: BookingStatus.CONFIRMED },
      }),

      // Query 7: Recent 10 bookings
      prisma.booking.findMany({
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
      }),

      // Query 8: Unread notifications count
      prisma.notification.count({
        where: { isRead: false },
      })
    ])

    // HIGH PERFORMANCE: Compute room sub-totals in-memory from loaded rooms array (0 extra database queries!)
    const totalRooms = rooms.length
    const availableRooms = rooms.filter(r => r.isAvailable && r.currentOccupancy === 0).length
    const bookedRooms = rooms.filter(r => r.currentOccupancy > 0).length
    const maintenanceRooms = rooms.filter(r => !r.isAvailable).length
    const acRooms = rooms.filter(r => r.roomType === RoomType.AC).length
    const nonAcRooms = rooms.filter(r => r.roomType === RoomType.NON_AC).length

    const totalEarnings = totalEarningsData._sum.amount || 0
    const monthlyEarnings = monthlyEarningsData._sum.amount || 0

    const stats = {
      rooms: {
        total: totalRooms,
        available: availableRooms,
        booked: bookedRooms,
        ac: acRooms,
        nonAc: nonAcRooms,
        maintenance: maintenanceRooms,
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

    console.log("✅ DEBUG: Dashboard Stats compiled successfully via parallel execution")
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
    const { enriched } = req.query

    // Construct query options dynamically to satisfy exactOptionalPropertyTypes constraint
    const queryOptions: any = {
      orderBy: { createdAt: "desc" },
      take: 50, // Last 50 notifications
    }

    // HIGH PERFORMANCE: Only run heavy multi-table SQL joins when explicitly requested by detailed pages
    if (enriched === "true") {
      queryOptions.include = {
        booking: {
          include: {
            room: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            payments: {
              orderBy: { createdAt: "desc" },
            },
            monthlyRenter: true,
            monthlyBills: {
              where: { isDeleted: false },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      }
    }

    const notifications = await prisma.notification.findMany(queryOptions)

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
// GET UNREAD NOTIFICATIONS COUNT (Lightweight)
// ==========================================
export const getUnreadNotificationsCount = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const count = await prisma.notification.count({
      where: { isRead: false },
    })
    res.status(200).json({ unreadCount: count })
  } catch (error) {
    console.error("Get unread notifications count error:", error)
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
