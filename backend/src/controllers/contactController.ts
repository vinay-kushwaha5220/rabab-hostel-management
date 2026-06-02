import type { Request, Response } from "express"
import nodemailer from "nodemailer"
import twilio from "twilio"

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-app-password",
  },
})

// Get Twilio client (lazy initialization)
const getTwilioClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return null
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
}

// ==========================================
// SEND CONTACT MESSAGE (Email + SMS)
// ==========================================
export const sendContactMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message, sendSms } = req.body

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, subject, and message are required",
      })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      })
    }

    // Phone validation for SMS
    let phoneFormatted = ""
    if (sendSms && phone) {
      // Remove all non-digit characters
      phoneFormatted = phone.replace(/\D/g, "")

      // Add country code if not present
      if (!phoneFormatted.startsWith("91")) {
        phoneFormatted = "91" + phoneFormatted
      }

      // Validate phone length (India: 10 digits + country code = 12)
      if (phoneFormatted.length < 10) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format",
        })
      }

      // Add + prefix for Twilio
      phoneFormatted = "+" + phoneFormatted
    }

    // Send email to admin
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER || "noreply@rababstay.com",
        to: process.env.ADMIN_EMAIL || "admin@rababstay.com",
        subject: `New Contact Form Submission: ${subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
          ${sendSms ? `<p><strong>SMS Notification:</strong> Sent to ${phone}</p>` : ""}
        `,
      })
    } catch (emailError) {
      console.error("Email sending error:", emailError)
      // Continue even if email fails
    }

    // Send confirmation email to user
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER || "noreply@rababstay.com",
        to: email,
        subject: "We received your message - Rabab Complex Stay",
        html: `
          <h2>Thank you for contacting us!</h2>
          <p>Hi ${name},</p>
          <p>We have received your message and will get back to you as soon as possible.</p>
          <p><strong>Your Message:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
          <p>Best regards,<br>Rabab Complex Stay Team</p>
        `,
      })
    } catch (emailError) {
      console.error("Confirmation email error:", emailError)
      // Continue even if email fails
    }

    // Send SMS if requested and phone is provided
    let smsSent = false
    if (sendSms && phone && phoneFormatted) {
      try {
        const twilioClient = getTwilioClient()
        if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
          await twilioClient.messages.create({
            body: `Hi ${name}, Thank you for contacting Rabab Complex Stay! We received your message about "${subject}" and will get back to you soon. - Rabab Complex Stay Team`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneFormatted,
          })
          smsSent = true
          console.log(`✅ SMS sent to ${phoneFormatted}`)
        }
      } catch (smsError: any) {
        console.error("SMS sending error:", smsError)
        // Don't fail the request if SMS fails
      }
    }

    return res.status(200).json({
      success: true,
      message: "Message sent successfully. We will contact you soon!",
      emailSent: true,
      smsSent: smsSent,
    })
  } catch (error: any) {
    console.error("Contact form error:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again later.",
      error: error.message,
    })
  }
}

// ==========================================
// GET CONTACT INFO
// ==========================================
export const getContactInfo = async (req: Request, res: Response) => {
  try {
    const contactInfo = {
      email: process.env.ADMIN_EMAIL || "admin@rababstay.com",
      phone: process.env.ADMIN_PHONE || "+91-XXXXXXXXXX",
      address: process.env.ADMIN_ADDRESS || "Rabab Complex Stay, Your City",
      hours: {
        weekdays: "9:00 AM - 6:00 PM",
        weekends: "10:00 AM - 4:00 PM",
      },
      socialMedia: {
        facebook: "https://facebook.com/rababstay",
        instagram: "https://instagram.com/rababstay",
        twitter: "https://twitter.com/rababstay",
      },
    }

    return res.status(200).json({
      success: true,
      data: contactInfo,
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact info",
      error: error.message,
    })
  }
}
