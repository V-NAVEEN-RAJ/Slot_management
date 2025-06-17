const express = require("express")
const Student = require("../models/Student")
const Batch = require("../models/Batch")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get students by batch
router.get("/:batchId", authenticateToken, async (req, res) => {
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

// Filter students by course
router.get("/filter/:courseId", authenticateToken, async (req, res) => {
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

// Create student
router.post("/", authenticateToken, async (req, res) => {
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

// Bulk create students
router.post("/bulk", authenticateToken, async (req, res) => {
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

// Update student
router.put("/:id", authenticateToken, async (req, res) => {
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

// Delete student
router.delete("/:id", authenticateToken, async (req, res) => {
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

module.exports = router
