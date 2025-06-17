const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const app = express()

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://slot-management-iota.vercel.app", // Replace with your actual frontend domain
      process.env.FRONTEND_URL,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

// Handle preflight requests
app.options("*", cors())

app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Trust proxy for Render deployment
app.set("trust proxy", 1)

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("✅ Connected to MongoDB Atlas")
  } catch (error) {
    console.error("❌ MongoDB connection error:", error)
    process.exit(1)
  }
}

// Models
const Admin = require("./models/Admin")
const Course = require("./models/Course")
const Batch = require("./models/Batch")
const Student = require("./models/Student")

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Access token required" })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Token verification error:", err)
      return res.status(403).json({ message: "Invalid token" })
    }
    req.user = user
    next()
  })
}

app.post("/auth/login", (req, res) => {
  console.log("⚠️ Frontend hit wrong route: /auth/login");
  res.status(404).json({ message: "Use /api/auth/login instead" });
});
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

// Auth Routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body
    console.log("Login attempt:", { username })

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" })
    }

    const admin = await Admin.findOne({ username })
    if (!admin) {
      console.log("Admin not found:", username)
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const isValidPassword = await bcrypt.compare(password, admin.password)
    if (!isValidPassword) {
      console.log("Invalid password for:", username)
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ id: admin._id, username: admin.username, role: admin.role }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    })

    console.log("Login successful:", username)
    res.json({
      token,
      admin: { id: admin._id, username: admin.username, email: admin.email, role: admin.role },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Admin Management Routes
app.get("/api/admins", authenticateToken, async (req, res) => {
  try {
    const admins = await Admin.find({}, { password: 0 })
    res.json(admins)
  } catch (error) {
    console.error("Get admins error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/admins", authenticateToken, async (req, res) => {
  try {
    const { username, password, email, role } = req.body

    if (!username || !password || !email) {
      return res.status(400).json({ message: "Username, password, and email are required" })
    }

    const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] })
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin with this username or email already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const admin = new Admin({
      username,
      password: hashedPassword,
      email,
      role: role || "admin",
    })

    await admin.save()

    const { password: _, ...adminData } = admin.toObject()
    res.status(201).json(adminData)
  } catch (error) {
    console.error("Create admin error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.put("/api/admins/:id/password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" })
    }

    const admin = await Admin.findById(req.params.id)
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" })
    }

    const isValidPassword = await bcrypt.compare(currentPassword, admin.password)
    if (!isValidPassword) {
      return res.status(400).json({ message: "Current password is incorrect" })
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
    admin.password = hashedNewPassword
    await admin.save()

    res.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Update password error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.delete("/api/admins/:id", authenticateToken, async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments()
    if (adminCount <= 1) {
      return res.status(400).json({ message: "Cannot delete the last admin" })
    }

    const admin = await Admin.findByIdAndDelete(req.params.id)
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" })
    }

    res.json({ message: "Admin deleted successfully" })
  } catch (error) {
    console.error("Delete admin error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Statistics Route
app.get("/api/statistics/:year", authenticateToken, async (req, res) => {
  try {
    const year = req.params.year
    console.log("Getting statistics for year:", year)

    const courses = await Course.find({ year })
    const courseIds = courses.map((course) => course._id)

    const batches = await Batch.find({ courseId: { $in: courseIds } })
    const batchIds = batches.map((batch) => batch._id)

    const students = await Student.find({ batchId: { $in: batchIds } })

    const paidStudents = students.filter((student) => student.fees_paid)
    const unpaidStudents = students.filter((student) => !student.fees_paid)

    const statistics = {
      totalCourses: courses.length,
      totalBatches: batches.length,
      totalStudents: students.length,
      paidStudents: paidStudents.length,
      unpaidStudents: unpaidStudents.length,
      courses: courses.map((course) => ({
        id: course._id,
        name: course.name,
        description: course.description,
        batchCount: batches.filter((batch) => batch.courseId.toString() === course._id.toString()).length,
      })),
    }

    console.log("Statistics:", statistics)
    res.json(statistics)
  } catch (error) {
    console.error("Statistics error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Student Filter Route
app.get("/api/students/filter/:courseId", authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.courseId
    console.log("Getting students for course:", courseId)

    const batches = await Batch.find({ courseId })
    const batchIds = batches.map((batch) => batch._id)

    const students = await Student.find({ batchId: { $in: batchIds } }).populate("batchId", "name")

    const studentsByBatch = batches.map((batch) => ({
      batchId: batch._id,
      batchName: batch.name,
      batchDescription: batch.description,
      batchStatus: batch.status,
      students: students.filter((student) => student.batchId._id.toString() === batch._id.toString()),
    }))

    const result = {
      courseId,
      totalStudents: students.length,
      batches: studentsByBatch,
    }

    console.log("Filtered students:", result)
    res.json(result)
  } catch (error) {
    console.error("Filter students error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Course Routes
app.get("/api/courses/:year", authenticateToken, async (req, res) => {
  try {
    const year = req.params.year
    console.log("Getting courses for year:", year)

    const courses = await Course.find({ year })
    console.log("Found courses:", courses.length)
    res.json(courses)
  } catch (error) {
    console.error("Get courses error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/courses", authenticateToken, async (req, res) => {
  try {
    const { name, description, year } = req.body
    console.log("Creating course:", { name, description, year })

    if (!name || !description || !year) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const course = new Course({ name, description, year })
    const savedCourse = await course.save()
    console.log("Course created:", savedCourse)

    res.status(201).json(savedCourse)
  } catch (error) {
    console.error("Create course error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.put("/api/courses/:id", authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body
    console.log("Updating course:", req.params.id, { name, description })

    if (!name || !description) {
      return res.status(400).json({ message: "Name and description are required" })
    }

    const course = await Course.findByIdAndUpdate(req.params.id, { name, description }, { new: true })

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    console.log("Course updated:", course)
    res.json(course)
  } catch (error) {
    console.error("Update course error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.delete("/api/courses/:id", authenticateToken, async (req, res) => {
  try {
    console.log("Deleting course:", req.params.id)

    const course = await Course.findByIdAndDelete(req.params.id)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    const batches = await Batch.find({ courseId: req.params.id })
    const batchIds = batches.map((batch) => batch._id)

    await Student.deleteMany({ batchId: { $in: batchIds } })
    await Batch.deleteMany({ courseId: req.params.id })

    console.log("Course and related data deleted")
    res.json({ message: "Course deleted successfully" })
  } catch (error) {
    console.error("Delete course error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Batch Routes
app.get("/api/batches/:courseId", authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.courseId
    console.log("Getting batches for course:", courseId)

    const batches = await Batch.find({ courseId })
    console.log("Found batches:", batches.length)
    res.json(batches)
  } catch (error) {
    console.error("Get batches error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/batches", authenticateToken, async (req, res) => {
  try {
    const { name, description, status, courseId } = req.body
    console.log("Creating batch:", { name, description, status, courseId })

    if (!name || !description || !courseId) {
      return res.status(400).json({ message: "Name, description, and courseId are required" })
    }

    const batch = new Batch({
      name,
      description,
      status: status || "ongoing",
      courseId,
    })

    const savedBatch = await batch.save()
    console.log("Batch created:", savedBatch)

    res.status(201).json(savedBatch)
  } catch (error) {
    console.error("Create batch error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.put("/api/batches/:id", authenticateToken, async (req, res) => {
  try {
    const { name, description, status } = req.body
    console.log("Updating batch:", req.params.id, { name, description, status })

    if (!name || !description) {
      return res.status(400).json({ message: "Name and description are required" })
    }

    const batch = await Batch.findByIdAndUpdate(req.params.id, { name, description, status }, { new: true })

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" })
    }

    console.log("Batch updated:", batch)
    res.json(batch)
  } catch (error) {
    console.error("Update batch error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.delete("/api/batches/:id", authenticateToken, async (req, res) => {
  try {
    console.log("Deleting batch:", req.params.id)

    const batch = await Batch.findByIdAndDelete(req.params.id)
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" })
    }

    await Student.deleteMany({ batchId: req.params.id })

    console.log("Batch and related students deleted")
    res.json({ message: "Batch deleted successfully" })
  } catch (error) {
    console.error("Delete batch error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Student Routes
app.get("/api/students/:batchId", authenticateToken, async (req, res) => {
  try {
    const batchId = req.params.batchId
    console.log("Getting students for batch:", batchId)

    const students = await Student.find({ batchId })
    console.log("Found students:", students.length)
    res.json(students)
  } catch (error) {
    console.error("Get students error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/students", authenticateToken, async (req, res) => {
  try {
    const { name, college_name, email, department, roll_number, phone_number, fees_paid, batchId } = req.body
    console.log("Creating student:", {
      name,
      college_name,
      email,
      department,
      roll_number,
      phone_number,
      fees_paid,
      batchId,
    })

    if (!name || !college_name || !email || !department || !roll_number || !phone_number || !batchId) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const student = new Student({
      name,
      college_name,
      email,
      department,
      roll_number,
      phone_number,
      fees_paid: fees_paid || false,
      batchId,
    })

    const savedStudent = await student.save()
    console.log("Student created:", savedStudent)

    res.status(201).json(savedStudent)
  } catch (error) {
    console.error("Create student error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/students/bulk", authenticateToken, async (req, res) => {
  try {
    const { students } = req.body
    console.log("Creating bulk students:", students?.length)

    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ message: "Students array is required" })
    }

    const createdStudents = await Student.insertMany(students)
    console.log("Bulk students created:", createdStudents.length)

    res.status(201).json(createdStudents)
  } catch (error) {
    console.error("Bulk create students error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.put("/api/students/:id", authenticateToken, async (req, res) => {
  try {
    const { name, college_name, email, department, roll_number, phone_number, fees_paid } = req.body
    console.log("Updating student:", req.params.id)

    if (!name || !college_name || !email || !department || !roll_number || !phone_number) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { name, college_name, email, department, roll_number, phone_number, fees_paid },
      { new: true },
    )

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    console.log("Student updated:", student)
    res.json(student)
  } catch (error) {
    console.error("Update student error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.delete("/api/students/:id", authenticateToken, async (req, res) => {
  try {
    console.log("Deleting student:", req.params.id)

    const student = await Student.findByIdAndDelete(req.params.id)
    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    console.log("Student deleted")
    res.json({ message: "Student deleted successfully" })
  } catch (error) {
    console.error("Delete student error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Initialize admin user
const initializeAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ username: "admin" })
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10)
      const admin = new Admin({
        username: "admin",
        password: hashedPassword,
        email: "admin@example.com",
        role: "super_admin",
      })
      await admin.save()
      console.log("✅ Default admin user created:")
      console.log("   Username: admin")
      console.log("   Password: admin123")
    } else {
      console.log("✅ Admin user already exists")
    }
  } catch (error) {
    console.error("❌ Error initializing admin:", error)
  }
}

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    environment: process.env.NODE_ENV || "development",
  })
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
    // console.log(`📡 API available at https://slot-management-cn.onrender.com`)
    // console.log(`🏥 Health check: http://localhost:${PORT}/api/health`)
    // console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
  })
}

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error)
  process.exit(1)
})
