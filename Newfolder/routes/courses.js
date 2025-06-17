const express = require("express")
const Course = require("../models/Course")
const Batch = require("../models/Batch")
const Student = require("../models/Student")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get courses by year
router.get("/:year", authenticateToken, async (req, res) => {
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

// Create course
router.post("/", authenticateToken, async (req, res) => {
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

// Update course
router.put("/:id", authenticateToken, async (req, res) => {
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

// Delete course
router.delete("/:id", authenticateToken, async (req, res) => {
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

module.exports = router
