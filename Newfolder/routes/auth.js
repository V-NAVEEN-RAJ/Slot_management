const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Admin = require("../models/Admin")

const router = express.Router()

// Login route
router.post("/login", async (req, res) => {
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

module.exports = router
