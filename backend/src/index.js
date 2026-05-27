import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import roomRoutes from "./routes/roomRoutes.js";
import authRoutesV2 from "./routes/authRoutesV2.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import electricityRoutes from "./routes/electricityRoutes.js";
import monthlyBillingRoutes from "./routes/monthlyBillingRoutes.js";
import messagingRoutes from "./routes/messagingRoutes.js";
import monthlyPaymentRoutes from "./routes/monthlyPaymentRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
const app = express();
// CORS configuration to allow credentials (cookies)
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [];
app.use(cors({
    origin: (origin, callback) => {
        // In production, check against allowed origins
        if (process.env.NODE_ENV === 'production' && allowedOrigins.length > 0) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error("Not allowed by CORS"));
            }
            return;
        }
        // In development, allow localhost and local network
        if (!origin) {
            // Allow requests with no origin (like mobile apps, Postman, curl)
            callback(null, true);
        }
        else if (origin.includes("localhost") ||
            origin.includes("127.0.0.1") ||
            origin.match(/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}/) || // 192.168.x.x
            origin.match(/^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}/) || // 10.x.x.x
            origin.match(/^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}/) // 172.16-31.x.x
        ) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true, // Allow cookies
}));
app.use(express.json());
app.use(cookieParser()); // Parse cookies
// Routes
app.use("/api/monthly-bills", monthlyBillingRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/auth", authRoutesV2);
app.use("/api/v2/auth", authRoutesV2);
app.use("/api/bookings", bookingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/electricity", electricityRoutes);
app.use("/api/messages", messagingRoutes);
app.use("/api/monthly-payments", monthlyPaymentRoutes);
app.use("/api/contact", contactRoutes);
app.get("/", (req, res) => {
    res.send("Rabab Stay Backend Running 🏨");
});
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces
app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on:`);
    console.log(`   - Local:   http://localhost:${PORT}`);
    console.log(`   - Network: http://<your-ip>:${PORT}`);
    console.log(`   - Host:    ${HOST}`);
});
// ─── BACKGROUND SCHEDULER: Automatic Billing Alerts ───
// Runs a check every 12 hours. It automatically dispatches alerts on the 5th of every month.
import { runAutomaticBillingReminders } from "./services/schedulerService.js";
const schedulerInterval = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
setInterval(async () => {
    try {
        console.log("⏰ Background Scheduler Check triggered...");
        const result = await runAutomaticBillingReminders(false);
        console.log(`⏰ Background Scheduler Check completed. Success: ${result.success}, Notified: ${result.notifiedCount}`);
    }
    catch (err) {
        console.error("⏰ Background Scheduler Error:", err);
    }
}, schedulerInterval);
// Run once immediately on startup with a brief delay so the server starts fully first
setTimeout(async () => {
    try {
        console.log("⏰ Background Scheduler Initial Startup Check...");
        const result = await runAutomaticBillingReminders(false);
        console.log(`⏰ Background Scheduler Initial Startup completed. Success: ${result.success}, Notified: ${result.notifiedCount}`);
    }
    catch (err) {
        console.error("⏰ Background Scheduler Startup Error:", err);
    }
}, 10000); // 10 seconds startup delay
//# sourceMappingURL=index.js.map