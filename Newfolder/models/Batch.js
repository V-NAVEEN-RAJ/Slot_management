const mongoose = require("mongoose")

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["ongoing", "completed", "upcoming"],
      default: "ongoing",
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Batch", batchSchema)
