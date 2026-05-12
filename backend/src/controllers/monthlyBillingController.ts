import type { Request, Response } from "express"
import prisma from "../config/prisma.js"
import type { AuthRequest } from "../middleware/authMiddleware.js"

// ==========================================
// CREATE MONTHLY BILL (Admin)
// ==========================================
export const createMonthlyBill = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, month, rentAmount, electricityAmount, extraCharges, dueDate } = req.body

    if (!bookingId || !month || !rentAmount || !dueDate) {
      return res.status(400).json({
        message: "bookingId, month, rentAmount, and dueDate are required",
      })
    }

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    })

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      })
    }

    // Check if bill already exists for this month
    const existingBill = await prisma.monthlyBill.findUnique({
      where: { bookingId },
    })

    if (existingBill && existingBill.month === month) {
      return res.status(400).json({
        message: "Bill already exists for this month",
      })
    }

    const totalAmount = rentAmount + (electricityAmount || 0) + (extraCharges || 0)

    // Create monthly bill
    const bill = await prisma.monthlyBill.create({
      data: {
        bookingId,
        month,
        rentAmount,
        electricityAmount: electricityAmount || 0,
        extraCharges: extraCharges || 0,
        totalAmount,
        dueDate: new Date(dueDate),
      },
      include: {
        booking: {
          include: {
            user: true,
            room: true,
          },
        },
      },
    })

    // Create notification for renter
    await prisma.notification.create({
      data: {
        bookingId,
        title: "Monthly Bill Added",
        message: `Your monthly bill for ${month} has been added. Total due: ₹${totalAmount}`,
        type: "billing",
      },
    })

    console.log(`✅ Monthly bill created for booking ${bookingId}`)

    res.status(201).json({
      message: "Monthly bill created successfully",
      bill,
    })
  } catch (error) {
    console.error("Create monthly bill error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET MONTHLY BILL (Renter/Admin)
// ==========================================
export const getMonthlyBill = async (req: AuthRequest, res: Response) => {
  try {
    const { billId } = req.params
    const userId = req.userId

    const bill = await prisma.monthlyBill.findUnique({
      where: { id: parseInt(billId) },
      include: {
        booking: {
          include: {
            user: true,
            room: true,
          },
        },
        payments: true,
      },
    })

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      })
    }

    // Check authorization
    if (bill.booking.user.id !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })
      if (user?.role !== "admin") {
        return res.status(403).json({
          message: "Unauthorized",
        })
      }
    }

    res.status(200).json(bill)
  } catch (error) {
    console.error("Get monthly bill error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET RENTER'S MONTHLY BILLS
// ==========================================
export const getRenterMonthlyBills = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    const bills = await prisma.monthlyBill.findMany({
      where: {
        booking: {
          userId,
        },
      },
      include: {
        booking: {
          include: {
            room: true,
          },
        },
        payments: true,
      },
      orderBy: {
        month: "desc",
      },
    })

    res.status(200).json(bills)
  } catch (error) {
    console.error("Get renter monthly bills error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET ALL MONTHLY BILLS (Admin)
// ==========================================
export const getAllMonthlyBills = async (req: AuthRequest, res: Response) => {
  try {
    const { status, month } = req.query

    const where: any = {}

    if (status === "paid") {
      where.isPaid = true
    } else if (status === "pending") {
      where.isPaid = false
    }

    if (month) {
      where.month = month
    }

    const bills = await prisma.monthlyBill.findMany({
      where,
      include: {
        booking: {
          include: {
            user: true,
            room: true,
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.status(200).json(bills)
  } catch (error) {
    console.error("Get all monthly bills error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// UPDATE MONTHLY BILL (Admin)
// ==========================================
export const updateMonthlyBill = async (req: AuthRequest, res: Response) => {
  try {
    const { billId } = req.params
    const { rentAmount, electricityAmount, extraCharges, dueDate } = req.body

    const bill = await prisma.monthlyBill.findUnique({
      where: { id: parseInt(billId) },
    })

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      })
    }

    const totalAmount =
      (rentAmount || bill.rentAmount) +
      (electricityAmount || bill.electricityAmount) +
      (extraCharges || bill.extraCharges)

    const updatedBill = await prisma.monthlyBill.update({
      where: { id: parseInt(billId) },
      data: {
        rentAmount: rentAmount || bill.rentAmount,
        electricityAmount: electricityAmount || bill.electricityAmount,
        extraCharges: extraCharges || bill.extraCharges,
        totalAmount,
        dueDate: dueDate ? new Date(dueDate) : bill.dueDate,
      },
      include: {
        booking: {
          include: {
            user: true,
            room: true,
          },
        },
        payments: true,
      },
    })

    console.log(`✅ Monthly bill updated: ${billId}`)

    res.status(200).json({
      message: "Monthly bill updated successfully",
      bill: updatedBill,
    })
  } catch (error) {
    console.error("Update monthly bill error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// DELETE MONTHLY BILL (Admin)
// ==========================================
export const deleteMonthlyBill = async (req: AuthRequest, res: Response) => {
  try {
    const { billId } = req.params

    const bill = await prisma.monthlyBill.findUnique({
      where: { id: parseInt(billId) },
    })

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      })
    }

    await prisma.monthlyBill.delete({
      where: { id: parseInt(billId) },
    })

    console.log(`✅ Monthly bill deleted: ${billId}`)

    res.status(200).json({
      message: "Monthly bill deleted successfully",
    })
  } catch (error) {
    console.error("Delete monthly bill error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET RENTER DASHBOARD DATA
// ==========================================
export const getRenterDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    // Get active booking
    const activeBooking = await prisma.booking.findFirst({
      where: {
        userId,
        status: "confirmed",
      },
      include: {
        room: true,
        monthlyBill: {
          include: {
            payments: true,
          },
        },
      },
    })

    if (!activeBooking) {
      return res.status(200).json({
        activeBooking: null,
        monthlyBill: null,
        messages: [],
        notifications: [],
      })
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        bookingId: activeBooking.id,
      },
      include: {
        sender: true,
        receiver: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    })

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: {
        bookingId: activeBooking.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    })

    res.status(200).json({
      activeBooking,
      monthlyBill: activeBooking.monthlyBill,
      messages,
      notifications,
    })
  } catch (error) {
    console.error("Get renter dashboard data error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
