import "dotenv/config"
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import roomRoutes from "./routes/roomRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import authRoutesV2 from "./routes/authRoutesV2.js"
import bookingRoutes from "./routes/bookingRoutes.js"
import dashboardRoutes from "./routes/dashboardRoutes.js"
import electricityRoutes from "./routes/electricityRoutes.js"
import monthlyBillingRoutes from "./routes/monthlyBillingRoutes.js"
import messagingRoutes from "./routes/messagingRoutes.js"
import monthlyPaymentRoutes from "./routes/monthlyPaymentRoutes.js"
import contactRoutes from "./routes/contactRoutes.js"

const app = express()

// CORS configuration to allow credentials (cookies)
app.use(cors({
  origin: (origin, callback) => {
    // Allow all localhost origins in development
    if (origin?.includes("localhost") || origin?.includes("127.0.0.1")) {
      callback(null, true)
    } else if (origin === "http://localhost:5173" || origin === "http://localhost:5174" || origin === "http://localhost:5175" || origin === "http://localhost:3000") {
      callback(null, true)
    } else if (!origin) {
      // Allow requests with no origin (like mobile apps or curl requests)
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true, // Allow cookies
}))

app.use(express.json())
app.use(cookieParser()) // Parse cookies

// Routes
app.use("/api/monthly-bills", monthlyBillingRoutes)
app.use("/api/rooms", roomRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/v2/auth", authRoutesV2)
app.use("/api/bookings", bookingRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/electricity", electricityRoutes)
app.use("/api/messages", messagingRoutes)
app.use("/api/monthly-payments", monthlyPaymentRoutes)
app.use("/api/contact", contactRoutes)

app.get("/", (req, res) => {
  res.send("Rabab Stay Backend Running 🏨")
})

const PORT = 5000

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})