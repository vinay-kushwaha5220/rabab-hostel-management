import type { Request, Response } from "express"
import prisma from "../config/prisma.js"
import type { AuthRequest } from "../middleware/authMiddleware.js"
import { MonthlyBillStatus, VerificationStatus, PaymentStatus, PaymentMethod, NotificationType, NotificationPriority, UserRole, BookingStatus, StayStatus, MonthlyRenterStatus } from "@prisma/client"

// ==========================================
// CREATE MONTHLY BILL (Admin)
// ==========================================
export const createMonthlyBill = async (req: AuthRequest, res: Response) => {
  console.log("🚀 createMonthlyBill controller HIT with body:", req.body)
  try {
    let { bookingId, month, rentAmount, electricityAmount, extraCharges, dueDate } = req.body

    // Ensure numeric values are numbers
    bookingId = parseInt(String(bookingId))
    rentAmount = parseFloat(String(rentAmount))
    electricityAmount = parseFloat(String(electricityAmount || 0))
    extraCharges = parseFloat(String(extraCharges || 0))

    if (isNaN(bookingId) || !month || isNaN(rentAmount) || !dueDate) {
      return res.status(400).json({
        message: "Valid bookingId, month, rentAmount, and dueDate are required",
      })
    }

    // Try to find booking by numeric ID or by the bookingId string
    let booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    })

    // If not found by numeric ID, try searching by the bookingId string (e.g., "RBS-2026-001")
    if (!booking) {
      booking = await prisma.booking.findUnique({
        where: { bookingId: String(req.body.bookingId) },
        include: { user: true },
      })
    }

    if (!booking) {
      return res.status(422).json({
        message: `Booking not found for ID or Code: ${req.body.bookingId}. Please check your database for this ID.`,
      })
    }

    // Ensure we use the correct numeric ID for the rest of the operation
    const actualBookingId = booking.id;
    bookingId = actualBookingId;

    // Check if bill already exists for this month
    const existingBill = await prisma.monthlyBill.findFirst({
      where: {
        bookingId,
        month,
      },
    })

    if (existingBill) {
      return res.status(400).json({
        message: "A bill already exists for this booking in the selected month",
      })
    }

    // Calculate totals and dues
    const currentMonthTotal = rentAmount + (electricityAmount || 0) + (extraCharges || 0)
    
    // Find previous month's bill to get remaining dues
    const previousBill = await prisma.monthlyBill.findFirst({
      where: {
        bookingId: actualBookingId,
      },
      orderBy: {
        month: 'desc'
      }
    })

    const previousDue = previousBill ? previousBill.remainingAmount : 0
    const totalDue = currentMonthTotal + previousDue
    const remainingAmount = totalDue // Initially full amount is remaining

    // Create monthly bill
    const bill = await prisma.monthlyBill.create({
      data: {
        bookingId: actualBookingId,
        month,
        rentAmount,
        electricityAmount: electricityAmount || 0,
        extraCharges: extraCharges || 0,
        totalAmount: currentMonthTotal,
        previousDue,
        totalDue,
        paidAmount: 0,
        remainingAmount,
        dueDate: new Date(dueDate),
        status: MonthlyBillStatus.PENDING,
        verificationStatus: VerificationStatus.PENDING,
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
        bookingId: actualBookingId,
        title: "Monthly Bill Added",
        message: `Your monthly bill for ${month} has been added. Total due: ₹${totalDue}`,
        type: NotificationType.BILL,
        priority: NotificationPriority.MEDIUM,
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
// GENERATE BULK MONTHLY BILLS (Admin)
// ==========================================
export const generateBulkMonthlyBills = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.body
    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year are required" })
    }

    const targetMonth = `${month} ${year}`
    
    // 1. Get all active monthly renters
    const activeBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        stayStatus: StayStatus.CHECKED_IN,
        room: {
          bookingType: "MONTHLY"
        }
      },
      include: {
        room: true,
        monthlyBills: {
          where: { month: targetMonth }
        }
      }
    })

    let createdCount = 0
    let skippedCount = 0

    for (const booking of activeBookings) {
      // Skip if bill already exists for this month
      if (booking.monthlyBills.length > 0) {
        skippedCount++
        continue
      }

      const rentAmount = booking.room.monthlyPrice || booking.room.price
      
      // Get previous dues
      const lastBill = await prisma.monthlyBill.findFirst({
        where: { bookingId: booking.id },
        orderBy: { createdAt: 'desc' }
      })
      
      const previousDue = lastBill ? lastBill.remainingAmount : 0
      const totalAmount = rentAmount // Starting with just rent for auto-gen
      const totalDue = totalAmount + previousDue
      
      // Default due date: 5th of the month
      const dueDate = new Date()
      dueDate.setDate(5)
      if (dueDate < new Date()) {
        dueDate.setMonth(dueDate.getMonth() + 1)
      }

      await prisma.monthlyBill.create({
        data: {
          bookingId: booking.id,
          month: targetMonth,
          rentAmount,
          electricityAmount: 0,
          extraCharges: 0,
          totalAmount,
          previousDue,
          totalDue,
          paidAmount: 0,
          remainingAmount: totalDue,
          dueDate,
          status: MonthlyBillStatus.PENDING,
          verificationStatus: VerificationStatus.PENDING,
        }
      })

      // Notify
      await prisma.notification.create({
        data: {
          bookingId: booking.id,
          title: `Rent Invoice: ${targetMonth}`,
          message: `Your monthly rent bill for ${targetMonth} has been generated. Amount: ₹${totalDue}`,
          type: NotificationType.BILL,
          priority: NotificationPriority.HIGH
        }
      })

      createdCount++
    }

    res.status(200).json({ 
      message: `Processing complete. Generated: ${createdCount}, Skipped: ${skippedCount}`,
      createdCount,
      skippedCount
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// ==========================================
// GET MONTHLY BILL (Renter/Admin)
// ==========================================
export const getMonthlyBill = async (req: AuthRequest, res: Response) => {
  try {
    const { billId } = req.params
    const userId = Number(req.userId)

    const bill = await prisma.monthlyBill.findUnique({
      where: { id: parseInt(String(billId)) },
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
      if (user?.role !== UserRole.ADMIN) {
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
    const userId = Number(req.userId)

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
    // Sync all renter overdue states first
    await syncAllRenterOverdueStatuses()

    const { status, month, year, roomNumber } = req.query

    const where: any = {
      isDeleted: false
    }

    if (status) {
      if (status === "PAID") {
        where.status = { in: [MonthlyBillStatus.PAID_ONLINE, MonthlyBillStatus.PAID_CASH] }
      } else {
        where.status = status as MonthlyBillStatus
      }
    }

    if (month) {
      // If month is just a name like "January", we might need to handle year too
      if (year) {
        where.month = `${month} ${year}`
      } else {
        where.month = { contains: String(month) }
      }
    } else if (year) {
      where.month = { contains: String(year) }
    }

    if (roomNumber) {
      where.booking = {
        room: {
          roomNumber: String(roomNumber)
        }
      }
    }

    // AUTO OVERDUE SYSTEM: Check and update status for all pending bills before returning
    const now = new Date()
    await prisma.monthlyBill.updateMany({
      where: {
        status: { in: [MonthlyBillStatus.PENDING, MonthlyBillStatus.PARTIAL] },
        dueDate: { lt: now },
        isPaid: false
      },
      data: {
        status: MonthlyBillStatus.OVERDUE
      }
    })

    const bills = await prisma.monthlyBill.findMany({
      where,
      include: {
        booking: {
          include: {
            user: true,
            room: true,
            monthlyRenter: true,
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
      where: { id: parseInt(String(billId)) },
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
      where: { id: parseInt(String(billId)) },
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
      where: { id: parseInt(String(billId)) },
    })

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      })
    }

    await prisma.monthlyBill.delete({
      where: { id: parseInt(String(billId)) },
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
// VERIFY MONTHLY PAYMENT (ADMIN)
// ==========================================
export const verifyMonthlyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { billId } = req.params
    const { amount, paymentMethod = PaymentMethod.CASH, transactionId } = req.body
    const numericBillId = Number(billId)

    if (isNaN(numericBillId)) {
      return res.status(400).json({ message: "Invalid bill ID" })
    }

    const bill = await prisma.monthlyBill.findUnique({
      where: { id: numericBillId },
      include: { booking: true }
    })

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" })
    }

    const paymentAmount = amount ? parseFloat(amount) : bill.remainingAmount
    const newPaidAmount = bill.paidAmount + paymentAmount
    const newRemainingAmount = Math.max(0, bill.totalDue - newPaidAmount)
    
    let newStatus: MonthlyBillStatus = MonthlyBillStatus.PARTIAL
    if (newRemainingAmount <= 0) {
      newStatus = paymentMethod === PaymentMethod.CASH ? MonthlyBillStatus.PAID_CASH : MonthlyBillStatus.PAID_ONLINE
    }

    // Update bill
    await prisma.monthlyBill.update({
      where: { id: numericBillId },
      data: {
        isPaid: newRemainingAmount <= 0,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        paidDate: newRemainingAmount <= 0 ? new Date() : bill.paidDate,
        status: newStatus,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        bookingId: bill.bookingId,
        monthlyBillId: numericBillId,
        amount: paymentAmount,
        paymentMethod: paymentMethod as PaymentMethod,
        paymentStatus: PaymentStatus.SUCCESS,
        verificationStatus: VerificationStatus.VERIFIED,
        transactionId: transactionId || `ADMIN-VERIFIED-${Date.now()}`,
      },
    })

    // AUTO EXTEND STAY CYCLE (Business Rule 3 & 4)
    const monthlyRenter = await prisma.monthlyRenter.findUnique({
      where: { bookingId: bill.bookingId }
    })

    if (monthlyRenter) {
      const prevEnd = monthlyRenter.currentCycleEnd || monthlyRenter.joinDate
      const nextStart = new Date(prevEnd)
      nextStart.setDate(nextStart.getDate() + 1)

      const nextEnd = new Date(nextStart)
      nextEnd.setMonth(nextEnd.getMonth() + 1)
      nextEnd.setDate(nextEnd.getDate() - 1)

      const isFull = newRemainingAmount <= 0

      console.log(`⚡ Stay Renewal Auto Extension: Renter id=${monthlyRenter.id}, isFull=${isFull}, pendingAmount=${newRemainingAmount}`)

      await prisma.monthlyRenter.update({
        where: { id: monthlyRenter.id },
        data: {
          currentCycleStart: nextStart,
          currentCycleEnd: nextEnd,
          dueDate: nextEnd,
          nextDueDate: nextEnd,
          paidAmount: newPaidAmount,
          pendingAmount: newRemainingAmount,
          overdueDays: 0,
          status: MonthlyRenterStatus.ACTIVE,
          paymentStatus: isFull ? "PAID" : "PARTIAL",
        }
      })
    }

    // Notify Renter
    await prisma.notification.create({
      data: {
        bookingId: bill.bookingId,
        title: "Payment Verified",
        message: `Your payment of ₹${paymentAmount} for ${bill.month} has been verified. Remaining: ₹${newRemainingAmount}`,
        type: NotificationType.PAYMENT,
        priority: NotificationPriority.MEDIUM,
      },
    })

    res.status(200).json({ 
      message: "Payment verified successfully",
      remainingAmount: newRemainingAmount,
      status: newStatus
    })
  } catch (error) {
    console.error("Verify payment error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

export const getRenterDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.userId)

    // Sync all renter overdue states first
    await syncAllRenterOverdueStatuses()

    // Get active booking
    const activeBooking = await prisma.booking.findFirst({
      where: {
        userId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        bookingType: "MONTHLY",
      },
      include: {
        room: true,
        monthlyRenter: true,
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

    // Get the most recent monthly bill for this booking
    const monthlyBill = await prisma.monthlyBill.findFirst({
      where: {
        bookingId: activeBooking.id,
      },
      include: {
        payments: true,
      },
      orderBy: {
        month: "desc",
      },
    })

    // Mark messages as read for the renter
    await prisma.message.updateMany({
      where: {
        bookingId: activeBooking.id,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    // Get messages (Re-fetch to get updated isRead status)
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

    console.log("✅ Dashboard data retrieved:", {
      bookingId: activeBooking.id,
      hasMonthlyBill: !!monthlyBill,
      messageCount: messages.length,
      notificationCount: notifications.length,
    })

    res.status(200).json({
      activeBooking,
      monthlyBill,
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

export const getAdminBillingStats = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query
    
    // Sync all renter overdue states first
    await syncAllRenterOverdueStatuses()

    const where: any = { isDeleted: false }
    if (month && year) {
      where.month = `${month} ${year}`
    } else if (month) {
      where.month = { contains: String(month) }
    } else if (year) {
      where.month = { contains: String(year) }
    }

    const bills = await prisma.monthlyBill.findMany({
      where,
      include: {
        booking: true
      }
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    // Overdue Renters count
    const totalOverdueRenters = await prisma.monthlyRenter.count({
      where: { status: MonthlyRenterStatus.OVERDUE }
    })

    // Expiring This Week count
    const totalExpiringThisWeek = await prisma.monthlyRenter.count({
      where: {
        status: { in: [MonthlyRenterStatus.ACTIVE, MonthlyRenterStatus.PENDING_PAYMENT] },
        currentCycleEnd: {
          gte: today,
          lte: sevenDaysFromNow
        }
      }
    })

    // Occupancy Rate
    const totalRooms = await prisma.room.count({ where: { isDeleted: false } })
    const occupiedRooms = await prisma.room.count({
      where: {
        isDeleted: false,
        currentOccupancy: { gt: 0 }
      }
    })
    const occupancyPercentage = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

    const stats = {
      totalExpected: bills.reduce((sum, b) => sum + b.totalDue, 0),
      totalReceived: bills.reduce((sum, b) => sum + b.paidAmount, 0),
      remainingDues: bills.reduce((sum, b) => sum + b.remainingAmount, 0),
      totalPendingRenters: bills.filter(b => b.status === MonthlyBillStatus.PENDING).length,
      totalPartialRenters: bills.filter(b => b.status === MonthlyBillStatus.PARTIAL).length,
      totalPaidRenters: bills.filter(b => b.isPaid).length,
      totalOverdueRenters,
      totalExpiringThisWeek,
      occupancyPercentage
    }

    res.status(200).json(stats)
  } catch (error) {
    console.error("Get admin billing stats error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

export const getRoomBillingHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params
    const numericRoomId = Number(roomId)

    if (isNaN(numericRoomId)) {
      return res.status(400).json({ message: "Invalid room ID" })
    }

    const bills = await prisma.monthlyBill.findMany({
      where: {
        booking: {
          roomId: numericRoomId
        },
        isDeleted: false
      },
      include: {
        booking: true,
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.status(200).json(bills)
  } catch (error) {
    console.error("Get room billing history error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

// ==========================================
// REAL-TIME AUTO OVERDUE & STATUS SYNC SYSTEM
// ==========================================
export const syncAllRenterOverdueStatuses = async () => {
  try {
    const activeRenters = await prisma.monthlyRenter.findMany({
      where: {
        status: { in: [MonthlyRenterStatus.ACTIVE, MonthlyRenterStatus.PENDING_PAYMENT, MonthlyRenterStatus.OVERDUE] }
      },
      include: {
        booking: true
      }
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    console.log(`⚡ Auto-Overdue System: checking ${activeRenters.length} monthly renters for state sync...`)

    for (const r of activeRenters) {
      if (!r.dueDate) continue

      const due = new Date(r.dueDate)
      due.setHours(0, 0, 0, 0)

      const diffTime = due.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let newStatus = r.status
      let newOverdueDays = 0
      let newPaymentStatus = r.paymentStatus

      if (diffDays < 0) {
        newStatus = MonthlyRenterStatus.OVERDUE
        newOverdueDays = Math.abs(diffDays)
        newPaymentStatus = "OVERDUE"
      } else {
        if (r.status === MonthlyRenterStatus.OVERDUE) {
          newStatus = MonthlyRenterStatus.ACTIVE
        }
        newOverdueDays = 0
        if (r.paymentStatus === "OVERDUE") {
          newPaymentStatus = "PENDING"
        }
      }

      if (r.status !== newStatus || r.overdueDays !== newOverdueDays || r.paymentStatus !== newPaymentStatus) {
        console.log(`👉 Updating Renter ${r.id} (${r.booking.customerName}): status ${r.status} -> ${newStatus}, overdueDays ${r.overdueDays} -> ${newOverdueDays}, paymentStatus ${r.paymentStatus} -> ${newPaymentStatus}`)
        await prisma.monthlyRenter.update({
          where: { id: r.id },
          data: {
            status: newStatus,
            overdueDays: newOverdueDays,
            paymentStatus: newPaymentStatus
          }
        })
      }
    }
  } catch (err) {
    console.error("❌ Error inside syncAllRenterOverdueStatuses:", err)
  }
}

// ==========================================
// RENTER REQUEST STAY RENEWAL (Business Rule 2, 6)
// ==========================================
export const requestStayRenewal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.userId)
    const { paymentMethod = "UPI" } = req.body

    // 1. Get active booking
    const activeBooking = await prisma.booking.findFirst({
      where: {
        userId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        bookingType: "MONTHLY",
      },
      include: {
        monthlyRenter: true,
      },
    })

    if (!activeBooking || !activeBooking.monthlyRenter) {
      return res.status(404).json({ message: "No active monthly renter profile found." })
    }

    const renter = activeBooking.monthlyRenter

    // 2. Prevent Double Renewal (Business Rule 6)
    const prevEnd = renter.currentCycleEnd || renter.joinDate
    const nextStart = new Date(prevEnd)
    nextStart.setDate(nextStart.getDate() + 1)
    
    const nextEnd = new Date(nextStart)
    nextEnd.setMonth(nextEnd.getMonth() + 1)
    nextEnd.setDate(nextEnd.getDate() - 1)

    const monthName = nextStart.toLocaleString("default", { month: "long" }) + " " + nextStart.getFullYear()

    const existingPendingBill = await prisma.monthlyBill.findFirst({
      where: {
        bookingId: activeBooking.id,
        month: monthName,
        isDeleted: false
      }
    })

    if (existingPendingBill) {
      return res.status(400).json({ message: "A stay renewal request is already pending verification for the next cycle." })
    }

    // 3. Create Stay Renewal MonthlyBill (under the hood)
    const newBill = await prisma.monthlyBill.create({
      data: {
        bookingId: activeBooking.id,
        month: monthName,
        rentAmount: renter.rentAmount,
        electricityAmount: 0,
        extraCharges: 0,
        totalDue: renter.rentAmount,
        paidAmount: 0,
        remainingAmount: renter.rentAmount,
        dueDate: nextEnd,
        status: MonthlyBillStatus.VERIFICATION_PENDING,
        verificationStatus: VerificationStatus.PENDING,
      }
    })

    // 4. Create Payment Record (Verification Pending)
    await prisma.payment.create({
      data: {
        bookingId: activeBooking.id,
        monthlyBillId: newBill.id,
        amount: renter.rentAmount,
        paymentMethod: paymentMethod as PaymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        verificationStatus: VerificationStatus.PENDING,
        transactionId: `RENEWAL-${Date.now()}`,
      }
    })

    // 5. Update MonthlyRenter's payment status to trigger waiting state
    await prisma.monthlyRenter.update({
      where: { id: renter.id },
      data: {
        paymentStatus: "PENDING_VERIFICATION"
      }
    })

    // 6. Create admin notification
    await prisma.notification.create({
      data: {
        bookingId: activeBooking.id,
        title: "Renewal Payment Received",
        message: `Renter ${activeBooking.customerName} submitted stay renewal request for room ${activeBooking.roomId} (${monthName}). Please verify.`,
        type: NotificationType.BILL,
        priority: NotificationPriority.HIGH,
      }
    })

    res.status(200).json({
      message: "Stay renewal request submitted successfully. Waiting for admin verification.",
      bill: newBill
    })
  } catch (error) {
    console.error("❌ Request stay renewal error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

// ==========================================
// SEND RENTER REMINDER (ADMIN)
// ==========================================
export const sendRenterReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params
    const numericBookingId = Number(bookingId)

    if (isNaN(numericBookingId)) {
      return res.status(400).json({ message: "Invalid booking ID" })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: numericBookingId },
      include: { monthlyRenter: true }
    })

    if (!booking || !booking.monthlyRenter) {
      return res.status(404).json({ message: "Renter profile not found." })
    }

    const renter = booking.monthlyRenter
    const dueAmount = renter.pendingAmount || renter.rentAmount

    // Create Notification for Renter
    await prisma.notification.create({
      data: {
        bookingId: numericBookingId,
        title: "🚨 Rent Payment Reminder",
        message: `Dear ${booking.customerName}, this is a reminder to settle your monthly rent of ₹${dueAmount.toLocaleString()}. Please renew your stay promptly.`,
        type: NotificationType.BILL,
        priority: NotificationPriority.HIGH,
      }
    })

    console.log(`✉️ Reminder notification sent to renter ${booking.customerName} (booking ${bookingId})`)

    res.status(200).json({ message: `Payment reminder notification sent successfully to ${booking.customerName}!` })
  } catch (error) {
    console.error("❌ Send renter reminder error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

// ==========================================
// REQUEST RENTER CHECKOUT (RENTER)
// ==========================================
export const requestRenterCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.userId)
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." })
    }

    // Find active booking and monthly renter record
    const booking = await prisma.booking.findFirst({
      where: {
        userId,
        bookingType: "MONTHLY",
        status: BookingStatus.CONFIRMED,
        stayStatus: { in: [StayStatus.CHECKED_IN, StayStatus.BOOKED, StayStatus.STAYING] }
      },
      include: {
        monthlyRenter: true
      }
    })

    if (!booking || !booking.monthlyRenter) {
      return res.status(404).json({ message: "Active monthly stay profile not found." })
    }

    const renter = booking.monthlyRenter

    if (renter.status === MonthlyRenterStatus.CHECKOUT_PENDING) {
      return res.status(400).json({ message: "Checkout request is already pending verification." })
    }

    // Update monthly renter status
    await prisma.monthlyRenter.update({
      where: { id: renter.id },
      data: {
        status: MonthlyRenterStatus.CHECKOUT_PENDING
      }
    })

    // Create notification for admin
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: "🔔 Checkout Request Submitted",
        message: `Renter ${booking.customerName} (Room ${booking.roomId}) has submitted a stay checkout request. Please approve or reject.`,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH,
      }
    })

    console.log(`🛎️ Checkout request received from renter ${booking.customerName} (booking ${booking.id})`)

    res.status(200).json({
      message: "Checkout request submitted successfully. Staying access will terminate upon Admin approval.",
      status: "CHECKOUT_PENDING"
    })
  } catch (error) {
    console.error("❌ Request renter checkout error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

// ==========================================
// REJECT RENTER CHECKOUT (ADMIN)
// ==========================================
export const rejectRenterCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params
    const numericBookingId = Number(bookingId)

    if (isNaN(numericBookingId)) {
      return res.status(400).json({ message: "Invalid booking ID" })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: numericBookingId },
      include: { monthlyRenter: true }
    })

    if (!booking || !booking.monthlyRenter) {
      return res.status(404).json({ message: "Monthly renter stay profile not found." })
    }

    const renter = booking.monthlyRenter

    // Revert status back to ACTIVE or OVERDUE depending on date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = renter.dueDate ? new Date(renter.dueDate) : today
    due.setHours(0, 0, 0, 0)

    const isOverdue = today.getTime() > due.getTime()
    const revertedStatus = isOverdue ? MonthlyRenterStatus.OVERDUE : MonthlyRenterStatus.ACTIVE

    await prisma.monthlyRenter.update({
      where: { id: renter.id },
      data: {
        status: revertedStatus
      }
    })

    // Create notification for renter
    await prisma.notification.create({
      data: {
        bookingId: numericBookingId,
        title: "❌ Checkout Request Rejected",
        message: `Your stay checkout request has been rejected by the property manager. Please contact administration for details.`,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH,
      }
    })

    console.log(`❌ Admin rejected checkout request for renter ${booking.customerName} (reverted to ${revertedStatus})`)

    res.status(200).json({
      message: `Checkout request for ${booking.customerName} successfully rejected. Renter status set to ${revertedStatus}.`,
      status: revertedStatus
    })
  } catch (error) {
    console.error("❌ Reject renter checkout error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}
