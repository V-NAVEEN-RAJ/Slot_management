const express = require("express")
const Batch = require("../models/Batch")
const Student = require("../models/Student")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get batches by course
router.get("/:courseId", authenticateToken, async (req, res) => {
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

// Create batch
router.post("/", authenticateToken, async (req, res) => {
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

// Update batch
router.put("/:id", authenticateToken, async (req, res) => {
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

// Delete batch
router.delete("/:id", authenticateToken, async (req, res) => {
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

module.exports = router
