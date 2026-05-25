import type { Request, Response } from "express"
import prisma from "../config/prisma.js"
import type { AuthRequest } from "../middleware/authMiddleware.js"
import { PaymentStatus, PaymentMethod, VerificationStatus, MonthlyBillStatus, MonthlyRenterStatus } from "@prisma/client"

// ==========================================
// PROCESS MONTHLY BILL PAYMENT
// ==========================================
export const processMonthlyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { billId: rawBillId, paymentMethod } = req.body
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - User session not found",
      })
    }
    const billId = Number(rawBillId)

    if (!billId || isNaN(billId) || !paymentMethod) {
      return res.status(400).json({
        message: "Valid billId and paymentMethod are required",
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

    if (!bill.booking || !bill.booking.user) {
      return res.status(422).json({
        message: "Bill is not properly linked to a renter or booking",
      })
    }

    // Check authorization
    if (bill.booking.userId !== userId && bill.booking.user.id !== userId) {
      return res.status(403).json({
        message: "Unauthorized to pay this bill",
      })
    }

    // SIMULATE DELAY FOR DEMO REALISM
    await new Promise(resolve => setTimeout(resolve, 2000))


    const isCash = (paymentMethod || "").toLowerCase() === "cash"
    const status = PaymentStatus.PENDING
    const txnId = isCash ? `CASH-REQ-${Date.now()}` : `UPI-REQ-${Date.now()}`

    // Create payment record (Both Cash and UPI require admin verification now!)
    const payment = await prisma.payment.create({
      data: {
        bookingId: bill.bookingId,
        monthlyBillId: billId,
        amount: bill.totalDue,
        paymentMethod: isCash ? PaymentMethod.CASH : PaymentMethod.UPI,
        paymentStatus: status,
        transactionId: txnId,
        verificationStatus: VerificationStatus.PENDING
      },
    })

    console.log(`💳 Payment notification record created: ${payment.id}. Method: ${paymentMethod}`)

    // Both payment methods are set to VERIFICATION_PENDING awaiting property manager approval
    await prisma.monthlyBill.update({
      where: { id: billId },
      data: {
        status: MonthlyBillStatus.VERIFICATION_PENDING,
        verificationStatus: VerificationStatus.PENDING
      }
    })

    const monthlyRenter = await prisma.monthlyRenter.findUnique({
      where: { bookingId: bill.bookingId }
    })

    if (monthlyRenter) {
      await prisma.monthlyRenter.update({
        where: { id: monthlyRenter.id },
        data: {
          paymentStatus: "PENDING_VERIFICATION"
        }
      })
    }
    console.log(`⏳ Bill ${billId} status updated to VERIFICATION_PENDING. Awaiting admin approval.`)

    // Create notification for admin to approve the payment
    await prisma.notification.create({
      data: {
        bookingId: bill.bookingId,
        title: isCash ? "Cash Payment Submitted" : "UPI Payment Submitted",
        message: isCash 
          ? `Cash payment of ₹${bill.totalDue} submitted by renter ${bill.booking.customerName} for ${bill.month} is awaiting verification & approval.`
          : `UPI payment notification of ₹${bill.totalDue} submitted by renter ${bill.booking.customerName} for ${bill.month} is awaiting verification & approval.`,
        type: "PAYMENT",
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

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - User session not found",
      })
    }

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
