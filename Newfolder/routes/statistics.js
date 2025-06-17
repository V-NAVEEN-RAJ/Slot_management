const express = require("express")
const Course = require("../models/Course")
const Batch = require("../models/Batch")
const Student = require("../models/Student")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get statistics by year
router.get("/:year", authenticateToken, async (req, res) => {
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

module.exports = router
