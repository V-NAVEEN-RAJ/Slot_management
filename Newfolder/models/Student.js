const mongoose = require("mongoose")

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    college_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    roll_number: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String,
      required: true,
    },
    fees_paid: {
      type: Boolean,
      default: false,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Student", studentSchema)
