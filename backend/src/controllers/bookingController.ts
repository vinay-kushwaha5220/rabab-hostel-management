import type { Response } from "express"
import prisma from "../config/prisma.js"
import type { AuthRequest } from "../middleware/authMiddleware.js"
import { BookingStatus, PaymentStatus, StayStatus, BookingType, NotificationType, NotificationPriority, VerificationStatus, MonthlyBillStatus, MonthlyRenterStatus, PaymentMethod } from "@prisma/client"
import { calculateBookingPrice } from "../services/pricingEngine.js"

// ==========================================
// CREATE BOOKING
// ==========================================
export const createBooking = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    console.log("🔍 DEBUG: Booking Creation Started")
    console.log("   - User ID:", req.userId)
    console.log("   - Request Body:", JSON.stringify(req.body, null, 2))

    const {
      roomId,
      customerName,
      customerEmail,
      customerPhone,
      customerAadhaar,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      bookingType, // DAILY or MONTHLY
    } = req.body

    // 1. Check required fields
    const requiredFields = { roomId, customerName, customerEmail, customerPhone, checkInDate, checkOutDate, numberOfGuests }
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => value === undefined || value === null || value === "")
      .map(([key]) => key)

    if (missingFields.length > 0) {
      console.log("❌ Validation failed: Missing fields:", missingFields)
      return res.status(400).json({
        message: "Validation failed: Missing required fields",
        missingFields,
        received: req.body
      })
    }

    // 2. Check room
    const room = await prisma.room.findUnique({
      where: { id: Number(roomId) },
    })

    if (!room) {
      console.log(`❌ Validation failed: Room ${roomId} not found`)
      return res.status(404).json({ message: "Room not found" })
    }

    if (!room.isAvailable) {
      console.log(`❌ Validation failed: Room ${roomId} is not available`)
      return res.status(400).json({ message: "Room is not available" })
    }

    if (room.currentOccupancy >= room.capacity) {
      console.log(`❌ Validation failed: Room ${roomId} is full (${room.currentOccupancy}/${room.capacity})`)
      return res.status(400).json({ message: "Room is already at full capacity" })
    }

    // 3. Check existing booking (Modified to prevent ANY duplicate active booking)
    const existingActiveBooking = await prisma.booking.findFirst({
      where: {
        userId: req.userId!,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        stayStatus: { in: [StayStatus.BOOKED, StayStatus.CHECKED_IN, StayStatus.STAYING] },
        isDeleted: false,
      }
    })

    if (existingActiveBooking) {
      console.log(`❌ Validation failed: User ${req.userId} already has active booking ${existingActiveBooking.bookingId}`)
      return res.status(400).json({
        message: "You already have an active room booking",
        existingBookingId: existingActiveBooking.bookingId
      })
    }

    // 4. Calculate dates
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)
    
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      console.log("❌ Validation failed: Invalid date format")
      return res.status(400).json({ message: "Invalid date format" })
    }

    const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

    if (totalDays <= 0) {
      console.log(`❌ Validation failed: Invalid date range (${totalDays} days)`)
      return res.status(400).json({ message: "Check-out date must be after check-in date" })
    }

    const selectedBookingType = bookingType || room.bookingType
    let totalAmount = 0
    let months = 1
    
    if (selectedBookingType === BookingType.MONTHLY) {
      months = (checkOut.getFullYear() - checkIn.getFullYear()) * 12 + (checkOut.getMonth() - checkIn.getMonth())
      if (months <= 0) months = 1
    }

    const priceInfo = calculateBookingPrice({
      room: {
        dailyPrice: room.dailyPrice || room.price,
        monthlyPrice: room.monthlyPrice || room.price * 30,
        price: room.price
      },
      stayType: selectedBookingType,
      duration: selectedBookingType === BookingType.MONTHLY ? months : totalDays
    })
    totalAmount = priceInfo.grandTotal

    // 5. Create booking
    const bookingCount = await prisma.booking.count()
    const bookingId = `RBS-${new Date().getFullYear()}-${String(bookingCount + 1).padStart(4, '0')}`

    // Wrap in transaction for safety
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the booking
      const booking = await tx.booking.create({
        data: {
          bookingId,
          userId: req.userId!,
          customerName: customerName,
          customerEmail: customerEmail,
          customerPhone: customerPhone,
          customerAadhaar: customerAadhaar || null,
          roomId: Number(roomId),
          bookingType: selectedBookingType as any,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: Number(numberOfGuests),
          totalDays,
          totalAmount,
          status: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          stayStatus: StayStatus.BOOKED,
        },
        include: {
          room: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // 2. Create notification
      await tx.notification.create({
        data: {
          bookingId: booking.id,
          title: "New Booking",
          message: `New booking ${bookingId} for room ${room.roomNumber}`,
          type: NotificationType.BOOKING,
          priority: NotificationPriority.MEDIUM,
        },
      });

      // 3. Auto-create MonthlyRenter profile for MONTHLY bookings
      if (selectedBookingType === BookingType.MONTHLY) {
        const joinDate = new Date(checkIn);
        const nextDueDate = new Date(joinDate);
        nextDueDate.setDate(nextDueDate.getDate() + 30);

        const rentAmount = room.monthlyPrice || (room.dailyPrice * 30) || (room.price * 30) || 0;

        await tx.monthlyRenter.create({
          data: {
            userId: req.userId!,
            bookingId: booking.id,
            roomId: Number(roomId),
            joinDate,
            lastPaidDate: null,
            nextDueDate,
            stayStatus: StayStatus.BOOKED,
            rentAmount,
            securityAmount: 2500,
            status: "PENDING_PAYMENT" as const
          }
        });
        
        console.log(`✅ Auto-created MonthlyRenter profile for booking ${bookingId}`);
      }

      return booking;
    });

    console.log(`✅ SUCCESS: Booking created: ${bookingId}`)

    res.status(201).json({
      message: "Booking created successfully",
      booking: result,
    })
  } catch (error: any) {
    console.error("❌ ERROR: Create booking failed:", error)
    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    })
  }
}

// ==========================================
// PROCESS PAYMENT
// ==========================================
export const processPayment = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { bookingId, paymentMethod, transactionId } = req.body

    if (!bookingId || !paymentMethod) {
      return res.status(400).json({
        message: "Booking ID and payment method are required",
      })
    }

    // Find booking
    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: { room: true },
    })

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      })
    }

    // Check for unsupported methods
    if (paymentMethod === "CARD" || paymentMethod === "ONLINE") {
      return res.status(400).json({
        message: "This payment method is not available yet. Please use UPI.",
      })
    }

    let finalTransactionId = transactionId
    let paymentStatus = PaymentStatus.PENDING

    if (paymentMethod === "UPI") {
      if (!transactionId) {
        return res.status(400).json({
          message: "Transaction ID / UTR reference code is required for UPI payments",
        })
      }
      if (!/^\d{12}$/.test(transactionId)) {
        return res.status(400).json({
          message: "UTR must be a 12-digit number",
        })
      }
    } else if (paymentMethod === "CASH") {
      finalTransactionId = `CASH-PENDING-${Date.now()}`
    } else {
      finalTransactionId = `DEMO-TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    }

    // Create pending payment record for BOTH Daily and Monthly bookings
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalAmount,
        paymentMethod: paymentMethod as PaymentMethod,
        transactionId: finalTransactionId,
        paymentStatus: PaymentStatus.PENDING,
      },
    })

    // Create notification for admin
    let notifTitle = "Payment Verification Pending"
    let notifMessage = `Booking ${booking.bookingId} has submitted a UPI payment of ₹${booking.totalAmount} (UTR: ${finalTransactionId}). Awaiting verification.`

    if (paymentMethod === "CASH") {
      notifTitle = "New Pay at Property Reservation"
      notifMessage = `Booking ${booking.bookingId} created with Pay at Property. Amount due: ₹${booking.totalAmount}.`
    }

    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: notifTitle,
        message: notifMessage,
        type: NotificationType.PAYMENT,
        priority: NotificationPriority.HIGH,
      },
    })

    console.log(`⏳ Payment verification pending for booking ${booking.bookingId}: ${finalTransactionId}`)

    res.status(200).json({
      message: paymentMethod === "CASH" 
        ? "Booking created. Payment pending at property." 
        : "Payment recorded. Awaiting admin verification.",
      payment,
      booking: {
        ...booking,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      },
    })
  } catch (error) {
    console.error("Process payment error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET USER BOOKINGS
// ==========================================
export const getUserBookings = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.userId! },
      include: {
        room: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    })

    res.status(200).json(bookings)
  } catch (error) {
    console.error("Get user bookings error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET ALL BOOKINGS (ADMIN)
// ==========================================
export const getAllBookings = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // AUTO-CHECKOUT LOGIC: Only for DAILY bookings, NOT for monthly renters
    // Monthly renters must explicitly request checkout or pay to continue
    const now = new Date()
    const overdueBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        bookingType: "DAILY", // ONLY DAILY BOOKINGS
        stayStatus: { in: [StayStatus.BOOKED, StayStatus.CHECKED_IN, StayStatus.STAYING] },
        checkOutDate: { lt: now },
        isDeleted: false
      },
      include: { room: true }
    })

    if (overdueBookings.length > 0) {
      console.log(`🧹 AUTO-CHECKOUT: Found ${overdueBookings.length} overdue DAILY stays. Processing...`)
      for (const b of overdueBookings) {
        await prisma.$transaction([
          prisma.booking.update({
            where: { id: b.id },
            data: { 
              status: BookingStatus.COMPLETED,
              stayStatus: StayStatus.CHECKED_OUT 
            }
          }),
          prisma.room.update({
            where: { id: b.roomId },
            data: { 
              currentOccupancy: { decrement: 1 },
            }
          })
        ])
      }
    }
    
    console.log(`✅ AUTO-CHECKOUT: Processed ${overdueBookings.length} DAILY bookings. Monthly renters are NOT auto-completed.`)

    const bookings = await prisma.booking.findMany({
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
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    })

    res.status(200).json(bookings)
  } catch (error) {
    console.error("Get all bookings error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// CHECK IN (ADMIN)
// ==========================================
export const checkInBooking = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) },
      include: { room: true }
    })
    if (!booking) return res.status(404).json({ message: "Booking not found" })
    
    await prisma.$transaction(async (tx) => {
      // 1. Update Booking stayStatus and confirm status
      await tx.booking.update({
        where: { id: Number(id) },
        data: {
          stayStatus: StayStatus.CHECKED_IN,
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.SUCCESS
        }
      })

      // 2. If MONTHLY stay, initialize cycles & first month's bill as PAID
      if (booking.bookingType === BookingType.MONTHLY) {
        const joinDate = new Date(booking.checkInDate)
        const firstCycleEnd = new Date(joinDate)
        firstCycleEnd.setDate(firstCycleEnd.getDate() + 29) // 30-day cycle inclusive
        firstCycleEnd.setHours(23, 59, 59, 999)

        const rentAmount = booking.room?.monthlyPrice || (booking.room?.dailyPrice * 30) || (booking.room?.price * 30) || 0

        // Find existing monthly renter profile or create one
        let renter = await tx.monthlyRenter.findUnique({
          where: { bookingId: booking.id }
        })

        if (renter) {
          await tx.monthlyRenter.update({
            where: { id: renter.id },
            data: {
              stayStatus: StayStatus.CHECKED_IN,
              currentCycleStart: joinDate,
              currentCycleEnd: firstCycleEnd,
              dueDate: firstCycleEnd,
              nextDueDate: firstCycleEnd,
              status: MonthlyRenterStatus.ACTIVE,
              paymentStatus: "PAID",
              pendingAmount: 0,
              paidAmount: rentAmount
            }
          })
        } else {
          renter = await tx.monthlyRenter.create({
            data: {
              userId: booking.userId,
              bookingId: booking.id,
              roomId: booking.roomId,
              joinDate,
              currentCycleStart: joinDate,
              currentCycleEnd: firstCycleEnd,
              dueDate: firstCycleEnd,
              nextDueDate: firstCycleEnd,
              stayStatus: StayStatus.CHECKED_IN,
              rentAmount,
              securityAmount: 2500,
              paidAmount: rentAmount,
              pendingAmount: 0,
              status: MonthlyRenterStatus.ACTIVE,
              paymentStatus: "PAID"
            }
          })
        }

        // Generate the first month's invoice as fully PAID and VERIFIED
        const firstMonthName = joinDate.toLocaleString("default", { month: "long" }) + " " + joinDate.getFullYear()

        const existingFirstBill = await tx.monthlyBill.findFirst({
          where: { bookingId: booking.id, month: firstMonthName }
        })

        if (existingFirstBill) {
          await tx.monthlyBill.update({
            where: { id: existingFirstBill.id },
            data: {
              rentAmount: rentAmount,
              totalAmount: rentAmount,
              totalDue: rentAmount,
              paidAmount: rentAmount,
              remainingAmount: 0,
              isPaid: true,
              status: MonthlyBillStatus.PAID_ONLINE,
              verificationStatus: VerificationStatus.VERIFIED
            }
          })
        } else {
          await tx.monthlyBill.create({
            data: {
              bookingId: booking.id,
              month: firstMonthName,
              rentAmount: rentAmount,
              electricityAmount: 0,
              extraCharges: 0,
              totalAmount: rentAmount,
              previousDue: 0,
              totalDue: rentAmount,
              paidAmount: rentAmount,
              remainingAmount: 0,
              isPaid: true,
              status: MonthlyBillStatus.PAID_ONLINE,
              verificationStatus: VerificationStatus.VERIFIED,
              dueDate: firstCycleEnd
            }
          })
        }

        // Generate second cycle bill as PENDING if checkout date spans into second cycle
        const secondCycleStart = new Date(firstCycleEnd)
        secondCycleStart.setDate(secondCycleStart.getDate() + 1)
        secondCycleStart.setHours(0, 0, 0, 0)

        const checkoutDate = new Date(booking.checkOutDate)
        if (checkoutDate > secondCycleStart) {
          const secondCycleEnd = new Date(secondCycleStart)
          secondCycleEnd.setMonth(secondCycleEnd.getMonth() + 1)
          secondCycleEnd.setDate(secondCycleEnd.getDate() - 1)
          secondCycleEnd.setHours(23, 59, 59, 999)

          const secondMonthName = secondCycleStart.toLocaleString("default", { month: "long" }) + " " + secondCycleStart.getFullYear()

          const existingSecondBill = await tx.monthlyBill.findFirst({
            where: { bookingId: booking.id, month: secondMonthName }
          })

          if (!existingSecondBill) {
            await tx.monthlyBill.create({
              data: {
                bookingId: booking.id,
                month: secondMonthName,
                rentAmount: rentAmount,
                electricityAmount: 0,
                extraCharges: 0,
                totalAmount: rentAmount,
                previousDue: 0,
                totalDue: rentAmount,
                paidAmount: 0,
                remainingAmount: rentAmount,
                isPaid: false,
                status: MonthlyBillStatus.PENDING,
                verificationStatus: VerificationStatus.PENDING,
                dueDate: secondCycleEnd
              }
            })
          }
        }
      }
    })
    
    res.status(200).json({ message: "Guest checked in successfully" })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// ==========================================
// CHECK OUT / END STAY (ADMIN)
// ==========================================
export const checkOutBooking = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  try {
    const booking = await prisma.booking.findUnique({ 
      where: { id: Number(id) },
      include: { room: true }
    })
    if (!booking) return res.status(404).json({ message: "Booking not found" })
    
    // Only process if not already checked out
    if (booking.stayStatus !== StayStatus.CHECKED_OUT) {
      await prisma.$transaction([
        prisma.booking.update({
          where: { id: Number(id) },
          data: { 
            stayStatus: StayStatus.CHECKED_OUT,
            status: BookingStatus.COMPLETED 
          }
        }),
        prisma.monthlyRenter.updateMany({
          where: { bookingId: booking.id },
          data: {
            status: "CHECKED_OUT",
            stayStatus: StayStatus.CHECKED_OUT
          }
        }),
        prisma.room.update({
          where: { id: booking.roomId },
          data: { 
            currentOccupancy: { decrement: 1 },
          }
        })
      ])
    }
    
    res.status(200).json({ message: "Checkout completed. Room is now available." })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// ==========================================
// REFUND (ADMIN)
// ==========================================
export const refundBooking = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  try {
    const booking = await prisma.booking.findUnique({ where: { id: Number(id) } })
    if (!booking) return res.status(404).json({ message: "Booking not found" })
    
    await prisma.booking.update({
      where: { id: Number(id) },
      data: { paymentStatus: PaymentStatus.REFUNDED }
    })
    
    res.status(200).json({ message: "Refund processed successfully" })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// ==========================================
// UNDO CHECKOUT / RESTORE STAY (ADMIN)
// ==========================================
export const undoCheckOutBooking = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  try {
    const booking = await prisma.booking.findUnique({ 
      where: { id: Number(id) },
      include: { room: true }
    })

    if (!booking) return res.status(404).json({ message: "Booking not found" })

    if (booking.stayStatus !== StayStatus.CHECKED_OUT) {
      return res.status(400).json({ message: "Only checked out stays can be restored" })
    }

    // Safety: Check if checkout happened within last 24 hours
    const now = new Date()
    const checkoutTime = new Date(booking.updatedAt)
    const hoursSinceCheckout = (now.getTime() - checkoutTime.getTime()) / (1000 * 60 * 60)

    if (hoursSinceCheckout > 24) {
      return res.status(400).json({ 
        message: "Restore failed: Safety window (24h) has passed. Please create a new booking if needed." 
      })
    }

    // Check if room has capacity to take them back
    if (booking.room.currentOccupancy >= booking.room.capacity) {
      return res.status(400).json({ 
        message: "Restore failed: Room is already full. Cannot restore stay." 
      })
    }

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: Number(id) },
        data: { 
          stayStatus: StayStatus.CHECKED_IN,
          status: BookingStatus.CONFIRMED 
        }
      }),
      prisma.room.update({
        where: { id: booking.roomId },
        data: { 
          currentOccupancy: { increment: 1 },
        }
      })
    ])

    res.status(200).json({ message: "Stay restored successfully. Room occupancy updated." })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// ==========================================
// GET MONTHLY ACTIVE BOOKINGS (ADMIN)
// ==========================================
export const getMonthlyActiveBookings = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // Debug: Fetch ALL bookings first to see what's in the DB
    const allBookings = await prisma.booking.findMany({
      include: { room: true }
    });
    console.log(`🔍 DEBUG: Total bookings in DB: ${allBookings.length}`);
    allBookings.forEach(b => {
      console.log(`   - Booking ${b.bookingId}: Status=${b.status}, Type=${b.room?.bookingType}`);
    });

    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] }, // Include pending for demo/testing
        room: {
          bookingType: {
            in: [BookingType.MONTHLY]
          }
        },
        isDeleted: false
      },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    console.log(`✅ Filtered Result: Found ${bookings.length} potential monthly renters`)
    res.status(200).json(bookings)
  } catch (error) {
    console.error("Get monthly active bookings error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// RENEW STAY / EXTEND MONTHLY (ADMIN)
// ==========================================
export const renewMonthlyStay = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  try {
    const electricityAmount = parseFloat(String(req.body.electricityAmount || 0))
    const maintenanceCharge = parseFloat(String(req.body.maintenanceCharge || 0))
    const notes = req.body.notes || ""

    const booking = await prisma.booking.findUnique({ 
      where: { id: Number(id) },
      include: { room: true }
    })

    if (!booking) return res.status(404).json({ message: "Booking not found" })

    if (booking.bookingType !== 'MONTHLY' && booking.room.bookingType !== 'MONTHLY') {
      return res.status(400).json({ message: "Only monthly bookings can be renewed" })
    }

    // Find the associated MonthlyRenter
    let renter = await prisma.monthlyRenter.findUnique({
      where: { bookingId: booking.id }
    })

    if (!renter) {
      console.log(`⚠️ Monthly renter profile missing for booking ${booking.id}. Auto-creating one...`)
      const joinDate = new Date(booking.checkInDate)
      const nextDueDate = new Date(joinDate)
      nextDueDate.setDate(nextDueDate.getDate() + 30)

      const rentAmount = booking.room.monthlyPrice || (booking.room.dailyPrice * 30) || (booking.room.price * 30) || 0
      const SECURITY_DEPOSIT = 2500

      renter = await prisma.monthlyRenter.create({
        data: {
          userId: booking.userId,
          bookingId: booking.id,
          roomId: booking.roomId,
          joinDate,
          lastPaidDate: null,
          nextDueDate,
          stayStatus: StayStatus.CHECKED_IN,
          rentAmount,
          securityAmount: SECURITY_DEPOSIT,
          status: "ACTIVE" as const
        }
      })
    }

    // Calculate dates for the next cycle based on the current checkout date (or previous cycle end)
    const prevEnd = renter.currentCycleEnd || renter.joinDate
    const nextStart = new Date(prevEnd)
    nextStart.setDate(nextStart.getDate() + 1)
    nextStart.setHours(0, 0, 0, 0)
    
    const nextEnd = new Date(nextStart)
    nextEnd.setMonth(nextEnd.getMonth() + 1)
    nextEnd.setDate(nextEnd.getDate() - 1)
    nextEnd.setHours(23, 59, 59, 999)

    // Calculate month name (e.g. "June 2026")
    const monthName = nextStart.toLocaleString("default", { month: "long" }) + " " + nextStart.getFullYear()

    // 1. Extend checkOutDate on the booking by 30 days
    const currentCheckOut = new Date(booking.checkOutDate)
    const newCheckOut = new Date(currentCheckOut)
    newCheckOut.setDate(newCheckOut.getDate() + 30)

    await prisma.booking.update({
      where: { id: Number(id) },
      data: { 
        checkOutDate: newCheckOut,
        status: BookingStatus.CONFIRMED 
      }
    })

    // 2. Fetch the latest MonthlyBill to see if there are remaining dues (previousPending)
    const lastBill = await prisma.monthlyBill.findFirst({
      where: { bookingId: booking.id, isDeleted: false },
      orderBy: { createdAt: 'desc' }
    })
    const previousPending = lastBill ? lastBill.remainingAmount : 0

    // 3. Create new bill with Rent + Electricity + Maintenance + Previous Dues
    const baseRent = renter.rentAmount
    const billTotal = baseRent + electricityAmount + maintenanceCharge + previousPending

    const newBill = await prisma.monthlyBill.create({
      data: {
        bookingId: booking.id,
        month: monthName,
        rentAmount: baseRent,
        electricityAmount: electricityAmount,
        extraCharges: maintenanceCharge,
        totalAmount: baseRent + electricityAmount + maintenanceCharge,
        previousDue: previousPending,
        totalDue: billTotal,
        paidAmount: 0,
        remainingAmount: billTotal,
        dueDate: nextEnd,
        status: MonthlyBillStatus.PENDING,
        verificationStatus: VerificationStatus.PENDING
      }
    })

    // 4. Update the MonthlyRenter stay status, cycle dates, and billing amounts
    await prisma.monthlyRenter.update({
      where: { id: renter.id },
      data: {
        status: MonthlyRenterStatus.PENDING_PAYMENT,
        currentCycleStart: nextStart,
        currentCycleEnd: nextEnd,
        dueDate: nextEnd,
        nextDueDate: nextEnd,
        lastElectricityAmount: electricityAmount,
        pendingAmount: billTotal,
        updatedAt: new Date()
      }
    })

    // 5. Notify Renter
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: "Rent Invoice Generated",
        message: `Your stay has been extended by 30 days. Next cycle: ${monthName}. Rent: ₹${baseRent}, Electricity: ₹${electricityAmount}, Maintenance: ₹${maintenanceCharge}. Total Due: ₹${billTotal}. Please pay to continue staying.`,
        type: NotificationType.BILL,
        priority: NotificationPriority.HIGH
      }
    })

    res.status(200).json({ 
      message: "Stay renewed and monthly rent invoice sent to renter.",
      newCheckOutDate: newCheckOut,
      bill: newBill
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// ==========================================
// GET SINGLE BOOKING
// ==========================================
export const getBookingById = async (
  req: AuthRequest,
  res: Response
) => {
  const { id } = req.params
  console.log("🔍 DEBUG: getBookingById Request")
  console.log("   - Params ID:", id)
  console.log("   - User ID from Token:", req.userId)

  try {
    const bookingId = Number(id)
    if (!id || isNaN(bookingId)) {
      console.log("❌ Invalid booking ID received:", id)
      return res.status(400).json({ message: "Invalid booking ID" })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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
        payments: true, // FIXED: Relation name is 'payments' in schema.prisma
      },
    })

    if (!booking) {
      console.log(`❌ Booking not found for ID: ${bookingId}`)
      return res.status(404).json({
        message: "Booking not found",
      })
    }

    console.log("✅ Booking found successfully")
    res.status(200).json(booking)
  } catch (error: any) {
    console.error("❌ ERROR in getBookingById:", error)
    res.status(500).json({
      message: error.message || "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    })
  }
}

// ==========================================
// CANCEL BOOKING (ADMIN)
// ==========================================
export const cancelBooking = async (
  req: AuthRequest,
  res: Response
) => {
  console.log("🔍 cancelBooking Params:", req.params)
  const { id } = req.params

  try {
    const bookingId = Number(id)
    if (!id || isNaN(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID" })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    })

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      })
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    })

    // Also update associated monthly renter record if exists
    await prisma.monthlyRenter.updateMany({
      where: { bookingId },
      data: {
        status: "CHECKED_OUT",
        stayStatus: StayStatus.CHECKED_OUT
      }
    })

    // Update room occupancy if it was confirmed
    if (booking.status === BookingStatus.CONFIRMED as any) {
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { 
          currentOccupancy: { decrement: 1 },
        },
      })
    }

    // Create cancellation notification
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: "Booking Cancelled",
        message: `Booking ${booking.bookingId} has been cancelled`,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.MEDIUM,
      },
    })

    console.log(`✅ Booking cancelled: ${booking.bookingId}`)

    res.status(200).json({
      message: "Booking cancelled successfully",
    })
  } catch (error) {
    console.error("Cancel booking error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
// ==========================================
// ADMIN: CONFIRM BOOKING MANUALLY
// ==========================================
export const confirmBooking = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params

    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) },
      include: { room: true }
    })

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      return res.status(400).json({ message: "Booking is already confirmed" })
    }

    // 1. Process payment verification
    const pendingPayment = await prisma.payment.findFirst({
      where: {
        bookingId: booking.id,
        paymentStatus: PaymentStatus.PENDING
      }
    })

    if (pendingPayment) {
      await prisma.payment.update({
        where: { id: pendingPayment.id },
        data: {
          paymentStatus: PaymentStatus.SUCCESS,
          verificationStatus: VerificationStatus.VERIFIED,
          verifiedAt: new Date()
        }
      })
      console.log(`✅ Verified pending extension payment: ${pendingPayment.transactionId}`)
    } else {
      const transactionId = `MANUAL-CONFIRM-${Date.now()}`
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.totalAmount,
          paymentMethod: "CASH", // Default to CASH for manual admin confirmation
          transactionId,
          paymentStatus: PaymentStatus.SUCCESS,
          verificationStatus: VerificationStatus.VERIFIED
        }
      })
      console.log(`✅ Created manual cash payment: ${transactionId}`)
    }

    // 2. Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.SUCCESS,
      }
    })

    // Update MonthlyRenter profile to ACTIVE and generate first month invoice
    if (booking.bookingType === BookingType.MONTHLY) {
      const joinDate = new Date(booking.checkInDate)
      const firstCycleEnd = new Date(joinDate)
      firstCycleEnd.setDate(firstCycleEnd.getDate() + 29)
      firstCycleEnd.setHours(23, 59, 59, 999)

      const rentAmount = booking.room?.monthlyPrice || (booking.room?.dailyPrice * 30) || (booking.room?.price * 30) || 0

      // Update MonthlyRenter
      await prisma.monthlyRenter.update({
        where: { bookingId: booking.id },
        data: {
          stayStatus: StayStatus.CHECKED_IN,
          currentCycleStart: joinDate,
          currentCycleEnd: firstCycleEnd,
          dueDate: firstCycleEnd,
          nextDueDate: firstCycleEnd,
          status: MonthlyRenterStatus.ACTIVE,
          paymentStatus: "PAID",
          pendingAmount: 0,
          paidAmount: rentAmount
        }
      })

      // Generate the first month's invoice as fully PAID and VERIFIED
      const firstMonthName = joinDate.toLocaleString("default", { month: "long" }) + " " + joinDate.getFullYear()

      const existingFirstBill = await prisma.monthlyBill.findFirst({
        where: { bookingId: booking.id, month: firstMonthName }
      })

      if (existingFirstBill) {
        await prisma.monthlyBill.update({
          where: { id: existingFirstBill.id },
          data: {
            rentAmount,
            totalAmount: rentAmount,
            totalDue: rentAmount,
            paidAmount: rentAmount,
            remainingAmount: 0,
            isPaid: true,
            status: MonthlyBillStatus.PAID_ONLINE,
            verificationStatus: VerificationStatus.VERIFIED
          }
        })
      } else {
        await prisma.monthlyBill.create({
          data: {
            bookingId: booking.id,
            month: firstMonthName,
            rentAmount,
            electricityAmount: 0,
            extraCharges: 0,
            totalAmount: rentAmount,
            previousDue: 0,
            totalDue: rentAmount,
            paidAmount: rentAmount,
            remainingAmount: 0,
            isPaid: true,
            status: MonthlyBillStatus.PAID_ONLINE,
            verificationStatus: VerificationStatus.VERIFIED,
            dueDate: firstCycleEnd
          }
        })
      }
    }

    // 3. Update room occupancy ONLY if guest is not already staying/checked-in
    if (booking.stayStatus !== StayStatus.CHECKED_IN && booking.stayStatus !== StayStatus.STAYING) {
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { 
          currentOccupancy: { increment: 1 },
        }
      })
      console.log(`🏨 Occupancy incremented for room ${booking.room?.roomNumber}`)
    } else {
      console.log(`🏨 Guest already checked-in/staying in room ${booking.room?.roomNumber}. Occupancy preserved.`)
    }

    // 4. Create notification
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: "Booking Confirmed",
        message: `Your booking ${booking.bookingId} has been manually confirmed by admin.`,
        type: NotificationType.BOOKING,
        priority: NotificationPriority.HIGH
      }
    })

    console.log(`✅ Admin manually confirmed booking: ${booking.bookingId}`)

    res.status(200).json({
      message: "Booking confirmed successfully",
    })
  } catch (error: any) {
    console.error("Confirm booking error:", error)
    res.status(500).json({
      message: "Server error",
      error: error.message
    })
  }
}

// ==========================================
// CHECK STAY EXTENSION AVAILABILITY (DAILY)
// ==========================================
export const checkExtensionAvailability = async (
  req: AuthRequest,
  res: Response
) => {
  const { id } = req.params
  const { newCheckOutDate } = req.body

  try {
    const bookingId = Number(id)
    if (!id || isNaN(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID" })
    }

    if (!newCheckOutDate) {
      return res.status(400).json({ message: "New checkout date is required" })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true }
    })

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    if (booking.bookingType !== BookingType.DAILY) {
      return res.status(400).json({ message: "Only daily bookings can be extended through this flow." })
    }

    const currentCheckOut = new Date(booking.checkOutDate)
    currentCheckOut.setHours(0, 0, 0, 0)
    
    const newCheckOut = new Date(newCheckOutDate)
    newCheckOut.setHours(0, 0, 0, 0)

    if (isNaN(newCheckOut.getTime())) {
      return res.status(400).json({ message: "Invalid date format for new check-out date" })
    }

    const extraDays = Math.round((newCheckOut.getTime() - currentCheckOut.getTime()) / (1000 * 60 * 60 * 24))

    if (extraDays <= 0) {
      return res.status(400).json({
        available: false,
        message: "New checkout date must be at least 1 day after the current checkout date."
      })
    }

    // Check for conflicting confirmed bookings for the same room in the extended range
    const conflict = await prisma.booking.findFirst({
      where: {
        roomId: booking.roomId,
        id: { not: booking.id },
        status: BookingStatus.CONFIRMED,
        isDeleted: false,
        checkInDate: { lt: newCheckOut },
        checkOutDate: { gt: booking.checkOutDate }
      }
    })

    if (conflict) {
      return res.status(200).json({
        available: false,
        message: "The room is already booked by another resident during these extended dates."
      })
    }

    const pricePerDay = booking.room.dailyPrice || booking.room.price || 0
    const extensionAmount = extraDays * pricePerDay

    return res.status(200).json({
      available: true,
      extraDays,
      pricePerDay,
      extensionAmount,
      message: "Dates are available for stay extension."
    })
  } catch (error: any) {
    console.error("Check stay extension availability error:", error)
    return res.status(500).json({
      message: "Server error",
      error: error.message
    })
  }
}

// ==========================================
// EXTEND DAILY STAY AND PROCESS PAYMENT
// ==========================================
export const extendDailyBooking = async (
  req: AuthRequest,
  res: Response
) => {
  const { id } = req.params
  const { newCheckOutDate, transactionId, paymentMethod } = req.body

  try {
    const bookingId = Number(id)
    if (!id || isNaN(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID" })
    }

    if (!newCheckOutDate) {
      return res.status(400).json({ message: "New checkout date is required" })
    }

    // Perform database operations inside a transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { room: true }
      })

      if (!booking) {
        throw new Error("Booking not found")
      }

      if (booking.bookingType !== BookingType.DAILY) {
        throw new Error("Only daily bookings can be extended")
      }

      const currentCheckOut = new Date(booking.checkOutDate)
      currentCheckOut.setHours(0, 0, 0, 0)

      const newCheckOut = new Date(newCheckOutDate)
      newCheckOut.setHours(0, 0, 0, 0)

      if (isNaN(newCheckOut.getTime())) {
        throw new Error("Invalid date format for new check-out date")
      }

      const extraDays = Math.round((newCheckOut.getTime() - currentCheckOut.getTime()) / (1000 * 60 * 60 * 24))

      if (extraDays <= 0) {
        throw new Error("New checkout date must be at least 1 day after current checkout date")
      }

      // Re-verify room availability inside the transaction
      const conflict = await tx.booking.findFirst({
        where: {
          roomId: booking.roomId,
          id: { not: booking.id },
          status: BookingStatus.CONFIRMED,
          isDeleted: false,
          checkInDate: { lt: newCheckOut },
          checkOutDate: { gt: booking.checkOutDate }
        }
      })

      if (conflict) {
        throw new Error("The room has already been booked by another resident during these extended dates.")
      }

      const pricePerDay = booking.room.dailyPrice || booking.room.price || 0
      const extensionAmount = extraDays * pricePerDay

      // Determine payment status
      const activePaymentMethod = paymentMethod || "UPI"
      const activeTransactionId = transactionId || `EXTN-${Date.now()}`

      // Create a Payment record for the stay extension as PENDING
      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: extensionAmount,
          paymentMethod: activePaymentMethod as any,
          transactionId: activeTransactionId,
          paymentStatus: PaymentStatus.PENDING, // PENDING verification
          verificationStatus: VerificationStatus.PENDING // Awaiting Admin
        }
      })

      // Update the booking details back to PENDING to await admin confirmation
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          checkOutDate: newCheckOut,
          totalDays: booking.totalDays + extraDays,
          totalAmount: booking.totalAmount + extensionAmount,
          status: BookingStatus.PENDING, // Transition back to pending approval
          paymentStatus: PaymentStatus.PENDING,
          stayStatus: StayStatus.STAYING // Renter is still in the room
        },
        include: { room: true }
      })

      // Create notification
      await tx.notification.create({
        data: {
          bookingId: booking.id,
          title: "Stay Extension Requested",
          message: `Extension request for booking ${booking.bookingId} to ${newCheckOut.toLocaleDateString()} is pending admin payment verification.`,
          type: NotificationType.BOOKING,
          priority: NotificationPriority.HIGH
        }
      })

      return { booking: updatedBooking, payment }
    })

    return res.status(200).json({
      message: "Stay extended successfully",
      booking: result.booking,
      payment: result.payment
    })
  } catch (error: any) {
    console.error("Extend stay failed:", error)
    return res.status(400).json({
      message: error.message || "Failed to extend stay"
    })
  }
}
