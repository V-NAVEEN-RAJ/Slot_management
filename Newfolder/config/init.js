const bcrypt = require("bcryptjs")
const Admin = require("../models/Admin")

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

module.exports = { initializeAdmin }
