import prisma from "../config/prisma.js"
import nodemailer from "nodemailer"

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-app-password",
  },
})

export const runAutomaticBillingReminders = async (force: boolean = false): Promise<{
  success: boolean
  notifiedCount: number
  logs: string[]
}> => {
  const logs: string[] = []
  const today = new Date()
  const dayOfMonth = today.getDate()

  logs.push(`[Scheduler] Checking monthly stay cycle alerts on ${today.toISOString()}`)

  // Only run automatically on the 5th of the month, unless forced via admin trigger
  if (dayOfMonth !== 5 && !force) {
    logs.push(`[Scheduler] Today is day ${dayOfMonth}. Automatic billing alerts only trigger on day 5 of the month. Skipping.`)
    return { success: true, notifiedCount: 0, logs }
  }

  logs.push(`[Scheduler] Day 5 stay cycle trigger activated! Syncing due invoices...`)

  try {
    // 1. Fetch all unpaid monthly bills that have not been sent reminders yet
    const unpaidBills = await prisma.monthlyBill.findMany({
      where: {
        isPaid: false,
        status: {
          in: ["PENDING", "OVERDUE"]
        },
        reminderSent: false,
        isDeleted: false
      },
      include: {
        booking: {
          include: {
            user: true,
            room: true
          }
        }
      }
    })

    logs.push(`[Scheduler] Found ${unpaidBills.length} unpaid monthly bills requiring alert dispatch.`)

    let notifiedCount = 0

    // 2. Fetch the primary Admin user to act as sender for direct in-app chat messages
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    })

    if (!admin) {
      logs.push(`[Scheduler] Warning: No ADMIN user found in system to act as the chat sender. Creating system message sender.`)
    }

    for (const bill of unpaidBills) {
      const booking = bill.booking
      const user = booking?.user
      
      if (!booking || !user) {
        logs.push(`[Scheduler] Skip: Bill ID ${bill.id} is missing booking or user relations.`)
        continue
      }

      logs.push(`[Scheduler] Dispatching alerts to renter ${user.name} (Unit ${booking.room?.roomNumber || "N/A"}) for invoice month ${bill.month}`)

      // ─── Dispatch 1: Direct In-App Chat Message ───
      try {
        const senderId = admin ? admin.id : user.id // Fallback to self-chat if no admin
        
        await prisma.message.create({
          data: {
            bookingId: booking.id,
            senderId: senderId,
            receiverId: user.id,
            content: `📢 **AUTOMATIC BILLING REMINDER** 📢\n\nHi ${user.name},\n\nThis is an automatic notification for your monthly stay cycle cycle. Your monthly invoice for **${bill.month}** is pending payment.\n\n* **Rent Fee:** ₹${bill.rentAmount.toLocaleString()}\n* **Electricity Charge:** ₹${bill.electricityAmount.toLocaleString()}\n* **Maintenance / Extras:** ₹${bill.extraCharges.toLocaleString()}\n* **Total Due Amount:** **₹${bill.totalDue.toLocaleString()}**\n\nPlease complete your payment immediately by scanning the QR code in your dashboard or visiting your monthly billing ledger. If you have already paid, please ignore this alert.\n\nThank you,\n**Rabab Stay Management**`
          }
        })
        logs.push(`[Scheduler] Direct chat message dispatched successfully to renter ${user.name}`)
      } catch (chatErr: any) {
        logs.push(`[Scheduler] Direct chat error for renter ${user.name}: ${chatErr.message}`)
      }

      // ─── Dispatch 2: Direct In-App System Notification ───
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            bookingId: booking.id,
            title: "📢 Billing Alert",
            message: `Pending monthly stay invoice for ${bill.month}. Total: ₹${bill.totalDue.toLocaleString()}. Please complete your payment immediately.`
          }
        })
      } catch (notifErr: any) {
        logs.push(`[Scheduler] In-app notification error for renter ${user.name}: ${notifErr.message}`)
      }

      // ─── Dispatch 3: Direct Email Message via Nodemailer ───
      try {
        const renterEmail = user.email || booking.customerEmail
        if (renterEmail && renterEmail.includes("@")) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER || "noreply@rababstay.com",
            to: renterEmail,
            subject: `⚠️ Monthly Stay Cycle Invoice Reminder: ${bill.month} - Rabab Stay`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 24px; text-align: center; color: white;">
                  <h2 style="margin: 0; font-size: 20px; font-weight: 800; tracking-tight: -0.025em;">Rabab Stay Cycle Billing</h2>
                  <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #60a5fa; letter-spacing: 0.1em;">Official Renter Notification</p>
                </div>
                <div style="padding: 24px; color: #334155; line-height: 1.6;">
                  <p style="font-size: 14px; margin-top: 0;">Hi <strong>${user.name}</strong>,</p>
                  <p style="font-size: 13px;">This is an automatic notification regarding your monthly billing statement for the room stay cycle <strong>${bill.month}</strong> at Rabab Stay.</p>
                  
                  <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                      <tr style="border-b: 1px solid #f1f5f9;">
                        <td style="padding: 8px 0; font-weight: bold; color: #64748b; text-transform: uppercase;">Room / Unit:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1e293b;">Room ${booking.room?.roomNumber || "N/A"}</td>
                      </tr>
                      <tr style="border-b: 1px solid #f1f5f9;">
                        <td style="padding: 8px 0; font-weight: bold; color: #64748b; text-transform: uppercase;">Base Rent:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1e293b;">₹${bill.rentAmount.toLocaleString()}</td>
                      </tr>
                      <tr style="border-b: 1px solid #f1f5f9;">
                        <td style="padding: 8px 0; font-weight: bold; color: #64748b; text-transform: uppercase;">Electricity Fee:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1e293b;">₹${bill.electricityAmount.toLocaleString()}</td>
                      </tr>
                      <tr style="border-b: 1px solid #f1f5f9;">
                        <td style="padding: 8px 0; font-weight: bold; color: #64748b; text-transform: uppercase;">Maintenance / Extras:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1e293b;">₹${bill.extraCharges.toLocaleString()}</td>
                      </tr>
                      <tr style="font-size: 14px;">
                        <td style="padding: 12px 0 0 0; font-weight: 800; color: #1e293b; text-transform: uppercase;">Total Due Amount:</td>
                        <td style="padding: 12px 0 0 0; text-align: right; font-weight: 900; color: #10b981;">₹${bill.totalDue.toLocaleString()}</td>
                      </tr>
                    </table>
                  </div>

                  <p style="font-size: 13px;">Please complete your payment immediately by logging into your Renter Dashboard to scan the auto-amount QR code or coordinate with the admin.</p>
                  
                  <div style="text-align: center; margin-top: 24px;">
                    <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/renter-monthly-dashboard?tab=bills" style="background-color: #1e293b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block;">View Invoice & Pay</a>
                  </div>
                </div>
                <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b;">
                  This is an automated system email. Please do not reply directly to this message.<br>
                  © Rabab Stay Hostel Management System.
                </div>
              </div>
            `,
          })
          logs.push(`[Scheduler] Automatic alert email successfully dispatched to ${renterEmail}`)
        }
      } catch (emailErr: any) {
        logs.push(`[Scheduler] Email dispatch error for renter ${user.name}: ${emailErr.message}`)
      }

      // ─── Step 4: Mark Reminder as Sent in Database ───
      await prisma.monthlyBill.update({
        where: { id: bill.id },
        data: {
          reminderSent: true,
          lastReminderAt: new Date()
        }
      })

      notifiedCount++
    }

    logs.push(`[Scheduler] Automatic billing reminder run complete. Successfully notified ${notifiedCount} renters.`)
    return { success: true, notifiedCount, logs }
  } catch (err: any) {
    logs.push(`[Scheduler] Critical error executing stay cycle alerts: ${err.message}`)
    console.error("Scheduler billing error:", err)
    return { success: false, notifiedCount: 0, logs }
  }
}
