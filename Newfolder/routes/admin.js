const express = require("express")
const bcrypt = require("bcryptjs")
const Admin = require("../models/Admin")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get all admins
router.get("/", authenticateToken, async (req, res) => {
  try {
    const admins = await Admin.find({}, { password: 0 })
    res.json(admins)
  } catch (error) {
    console.error("Get admins error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create admin
router.post("/", authenticateToken, async (req, res) => {
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

// Update admin password
router.put("/:id/password", authenticateToken, async (req, res) => {
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

// Delete admin
router.delete("/:id", authenticateToken, async (req, res) => {
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

module.exports = router
