import type { Request, Response } from "express"
import prisma from "../config/prisma.js"
import type { AuthRequest } from "../middleware/authMiddleware.js"

// ==========================================
// PROCESS MONTHLY BILL PAYMENT
// ==========================================
export const processMonthlyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { billId, paymentMethod } = req.body
    const userId = req.userId

    if (!billId || !paymentMethod) {
      return res.status(400).json({
        message: "billId and paymentMethod are required",
      })
    }

    // Get bill
    const bill = await prisma.monthlyBill.findUnique({
      where: { id: billId },
      include: {
        booking: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      })
    }

    // Check authorization
    if (bill.booking.user.id !== userId) {
      return res.status(403).json({
        message: "Unauthorized",
      })
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        bookingId: bill.bookingId,
        monthlyBillId: billId,
        amount: bill.totalAmount,
        paymentMethod,
        paymentStatus: "success",
        transactionId: `TXN-${Date.now()}`,
      },
    })

    // Update bill as paid
    await prisma.monthlyBill.update({
      where: { id: billId },
      data: {
        isPaid: true,
        paidDate: new Date(),
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        bookingId: bill.bookingId,
        title: "Payment Received",
        message: `Payment of ₹${bill.totalAmount} for ${bill.month} has been received successfully`,
        type: "payment",
      },
    })

    console.log(`✅ Monthly payment processed: ${payment.id}`)

    res.status(201).json({
      message: "Payment processed successfully",
      payment,
    })
  } catch (error) {
    console.error("Process monthly payment error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET PAYMENT HISTORY
// ==========================================
export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    const payments = await prisma.payment.findMany({
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
        monthlyBill: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.status(200).json(payments)
  } catch (error) {
    console.error("Get payment history error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET ALL PAYMENTS (Admin)
// ==========================================
export const getAllPayments = async (req: AuthRequest, res: Response) => {
  try {
    const { status, month } = req.query

    const where: any = {}

    if (status) {
      where.paymentStatus = status
    }

    if (month) {
      where.monthlyBill = {
        month,
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            user: true,
            room: true,
          },
        },
        monthlyBill: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.status(200).json(payments)
  } catch (error) {
    console.error("Get all payments error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET PAYMENT STATISTICS (Admin)
// ==========================================
export const getPaymentStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalPayments = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      _count: true,
    })

    const pendingBills = await prisma.monthlyBill.aggregate({
      where: {
        isPaid: false,
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    })

    const paidBills = await prisma.monthlyBill.aggregate({
      where: {
        isPaid: true,
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    })

    res.status(200).json({
      totalPayments: {
        count: totalPayments._count,
        amount: totalPayments._sum.amount || 0,
      },
      pendingBills: {
        count: pendingBills._count,
        amount: pendingBills._sum.totalAmount || 0,
      },
      paidBills: {
        count: paidBills._count,
        amount: paidBills._sum.totalAmount || 0,
      },
    })
  } catch (error) {
    console.error("Get payment stats error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
