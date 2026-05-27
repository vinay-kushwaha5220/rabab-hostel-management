import type { Request, Response } from "express"
import prisma from "../config/prisma.js"
import type { AuthRequest } from "../middleware/authMiddleware.js"
import { PaymentStatus, PaymentMethod, VerificationStatus, MonthlyBillStatus, MonthlyRenterStatus } from "@prisma/client"
import razorpay from "../config/razorpay.js"
import crypto from "crypto"

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

// ==========================================
// CREATE RAZORPAY ORDER
// ==========================================
export const createRazorpayOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { billId: rawBillId } = req.body
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - User session not found",
      })
    }
    const billId = Number(rawBillId)

    if (!billId || isNaN(billId)) {
      return res.status(400).json({
        message: "Valid billId is required",
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

    if (bill.isPaid || bill.remainingAmount <= 0) {
      return res.status(400).json({
        message: "This bill has already been fully paid",
      })
    }

    // Create order options
    const amountInPaise = Math.round(bill.remainingAmount * 100) // Razorpay requires amount in Paise (INR * 100)
    
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_bill_${billId}_${Date.now()}`,
      notes: {
        billId: String(billId),
        bookingId: String(bill.bookingId),
        customerName: bill.booking.customerName,
        month: bill.month,
      }
    }

    console.log(`Creating Razorpay Order for Bill ID ${billId}, Amount: ₹${bill.remainingAmount}...`)
    const order = await razorpay.orders.create(options)

    res.status(200).json({
      message: "Razorpay order created successfully",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || "mock_key_id",
      bill: {
        id: bill.id,
        month: bill.month,
        remainingAmount: bill.remainingAmount
      }
    })
  } catch (error) {
    console.error("Create Razorpay order error:", error)
    res.status(500).json({
      message: "Server error creating payment order",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// VERIFY RAZORPAY PAYMENT
// ==========================================
export const verifyRazorpayPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      billId: rawBillId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature 
    } = req.body
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - User session not found",
      })
    }

    const billId = Number(rawBillId)
    if (!billId || isNaN(billId) || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: "Invalid verification data. All parameters are required.",
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

    // Verify signature using HMAC-SHA256
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      return res.status(500).json({
        message: "Razorpay Key Secret is not configured on the server",
      })
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body.toString())
      .digest("hex")

    const isSignatureValid = expectedSignature === razorpay_signature

    if (!isSignatureValid) {
      console.error(`❌ Razorpay signature verification FAILED for Bill ID ${billId}`)
      return res.status(400).json({
        message: "Payment signature verification failed. Unauthorized transaction.",
      })
    }

    console.log(`✅ Razorpay signature verified successfully for Bill ID ${billId}, Payment ID ${razorpay_payment_id}`)

    // Start database updates
    const paidAmt = bill.remainingAmount

    // 1. Create a verified Payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: bill.bookingId,
        monthlyBillId: billId,
        amount: paidAmt,
        paymentMethod: PaymentMethod.ONLINE,
        transactionId: razorpay_payment_id,
        paymentStatus: PaymentStatus.SUCCESS,
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        verificationNotes: "Automatically verified via secure Razorpay checkout integration."
      },
    })

    // 2. Update the MonthlyBill
    const updatedBill = await prisma.monthlyBill.update({
      where: { id: billId },
      data: {
        paidAmount: {
          increment: paidAmt,
        },
        remainingAmount: 0,
        isPaid: true,
        status: MonthlyBillStatus.PAID,
        paidDate: new Date(),
        verificationStatus: VerificationStatus.VERIFIED,
      }
    })

    // 3. Update the MonthlyRenter ledger outstanding amounts
    const monthlyRenter = await prisma.monthlyRenter.findUnique({
      where: { bookingId: bill.bookingId }
    })

    if (monthlyRenter) {
      const newPaidAmt = (monthlyRenter.paidAmount || 0) + paidAmt
      const newPendingAmt = Math.max(0, (monthlyRenter.pendingAmount || 0) - paidAmt)

      await prisma.monthlyRenter.update({
        where: { id: monthlyRenter.id },
        data: {
          paidAmount: newPaidAmt,
          pendingAmount: newPendingAmt,
          paymentStatus: "SUCCESS",
          status: MonthlyRenterStatus.ACTIVE
        }
      })
    }

    // 4. Create notification for payment success
    await prisma.notification.create({
      data: {
        bookingId: bill.bookingId,
        title: "Rent Payment Successful",
        message: `Online payment of ₹${paidAmt} received successfully for ${bill.month}. Invoice #${billId} is fully settled.`,
        type: "PAYMENT",
      },
    })

    res.status(200).json({
      message: "Payment verified and recorded successfully!",
      payment,
      bill: updatedBill
    })
  } catch (error) {
    console.error("Verify Razorpay payment error:", error)
    res.status(500).json({
      message: "Server error verifying payment",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
