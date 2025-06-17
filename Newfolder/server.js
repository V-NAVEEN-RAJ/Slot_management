const express = require("express")
const cors = require("cors")
require("dotenv").config()

const connectDB = require("./config/database")
const { initializeAdmin } = require("./config/init")

// Import routes
const authRoutes = require("./routes/auth")
const adminRoutes = require("./routes/admin")
const courseRoutes = require("./routes/courses")
const batchRoutes = require("./routes/batches")
const studentRoutes = require("./routes/students")
const statisticsRoutes = require("./routes/statistics")

const app = express()

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "https://slot-management-iota.vercel.app", process.env.FRONTEND_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

app.options("*", cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.set("trust proxy", 1)

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Slot Booking System API",
    status: "Running",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth/login",
      courses: "/api/courses",
      batches: "/api/batches",
      students: "/api/students",
      admins: "/api/admins",
    },
  })
})

// Health check route
app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose")
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    environment: process.env.NODE_ENV || "development",
  })
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/admins", adminRoutes)
app.use("/api/courses", courseRoutes)
app.use("/api/batches", batchRoutes)
app.use("/api/students", studentRoutes)
app.use("/api/statistics", statisticsRoutes)

// Debug route for wrong endpoint
app.post("/auth/login", (req, res) => {
  console.log("⚠️ Frontend hit wrong route: /auth/login")
  res.status(404).json({ message: "Use /api/auth/login instead" })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)
  res.status(500).json({ message: "Internal server error" })
})

const PORT = process.env.PORT || 5000

// Start server
const startServer = async () => {
  await connectDB()
  await initializeAdmin()

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`)
  })
}

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error)
  process.exit(1)
})
