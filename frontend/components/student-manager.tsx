"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Plus, Edit, Trash2, Upload, Download } from "lucide-react"
import { downloadExcel, readExcelFile } from "@/lib/excel-utils"
import { apiClient } from "@/lib/api"

interface Student {
  _id: string
  name: string
  college_name: string
  email: string
  department: string
  roll_number: string
  phone_number: string
  fees_paid: boolean
  batchId: string
}

interface Batch {
  _id: string
  name: string
  description: string
  status: "ongoing" | "completed"
  courseId: string
}

interface Course {
  _id: string
  name: string
  description: string
  year: string
}

interface StudentManagerProps {
  batch: Batch
  course: Course
  onDataChange?: () => void
}

export default function StudentManager({ batch, course, onDataChange }: StudentManagerProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [newStudent, setNewStudent] = useState({
    name: "",
    college_name: "",
    email: "",
    department: "",
    roll_number: "",
    phone_number: "",
    fees_paid: false,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchStudents()
  }, [batch._id])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const studentsData = await apiClient.getStudents(batch._id)
      setStudents(studentsData)
    } catch (error) {
      console.error("Error fetching students:", error)
      alert("Failed to fetch students")
    } finally {
      setLoading(false)
    }
  }

  const handleAddStudent = async () => {
    if (
      !newStudent.name ||
      !newStudent.college_name ||
      !newStudent.email ||
      !newStudent.department ||
      !newStudent.roll_number ||
      !newStudent.phone_number
    ) {
      alert("Please fill all fields")
      return
    }

    try {
      const student = {
        ...newStudent,
        batchId: batch._id,
      }
      const createdStudent = await apiClient.createStudent(student)
      setStudents([...students, createdStudent])
      setNewStudent({
        name: "",
        college_name: "",
        email: "",
        department: "",
        roll_number: "",
        phone_number: "",
        fees_paid: false,
      })
      setIsAddDialogOpen(false)
      onDataChange?.()
    } catch (error) {
      console.error("Error creating student:", error)
      alert("Failed to create student")
    }
  }

  const handleEditStudent = async () => {
    if (
      !editingStudent ||
      !newStudent.name ||
      !newStudent.college_name ||
      !newStudent.email ||
      !newStudent.department ||
      !newStudent.roll_number ||
      !newStudent.phone_number
    ) {
      alert("Please fill all fields")
      return
    }

    try {
      const updatedStudent = {
        ...newStudent,
        batchId: batch._id,
      }
      await apiClient.updateStudent(editingStudent._id, updatedStudent)
      setStudents(students.map((s) => (s._id === editingStudent._id ? { ...s, ...updatedStudent } : s)))
      setIsEditDialogOpen(false)
      setEditingStudent(null)
      setNewStudent({
        name: "",
        college_name: "",
        email: "",
        department: "",
        roll_number: "",
        phone_number: "",
        fees_paid: false,
      })
      onDataChange?.()
    } catch (error) {
      console.error("Error updating student:", error)
      alert("Failed to update student")
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return

    try {
      await apiClient.deleteStudent(studentId)
      setStudents(students.filter((s) => s._id !== studentId))
      onDataChange?.()
    } catch (error) {
      console.error("Error deleting student:", error)
      alert("Failed to delete student")
    }
  }

  const openEditDialog = (student: Student) => {
    setEditingStudent(student)
    setNewStudent({
      name: student.name,
      college_name: student.college_name,
      email: student.email,
      department: student.department,
      roll_number: student.roll_number,
      phone_number: student.phone_number,
      fees_paid: student.fees_paid,
    })
    setIsEditDialogOpen(true)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const jsonData = await readExcelFile(file)

        const newStudents = jsonData.map((row) => ({
          name: row.name || "",
          college_name: row.college_name || "",
          email: row.email || "",
          department: row.department || "",
          roll_number: row.roll_number || "",
          phone_number: row.phone_number || "",
          fees_paid: row.fees_paid === true || row.fees_paid === "true" || row.fees_paid === 1,
          batchId: batch._id,
        }))

        const createdStudents = await apiClient.createStudentsBulk(newStudents)
        setStudents([...students, ...createdStudents])
        alert(`Successfully uploaded ${createdStudents.length} students`)
        onDataChange?.()
      } catch (error) {
        console.error("Error uploading students:", error)
        alert("Failed to upload students. Please ensure the file is in CSV format.")
      }
    }
  }

  const handleDownload = () => {
    const exportData = students.map((student) => ({
      name: student.name,
      college_name: student.college_name,
      email: student.email,
      department: student.department,
      roll_number: student.roll_number,
      phone_number: student.phone_number,
      fees_paid: student.fees_paid,
    }))

    downloadExcel(exportData, `${course.name}_${batch.name}_students.csv`)
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center p-6 border-b">
        <div>
          <h3 className="text-lg font-semibold">Students in {batch.name}</h3>
          <p className="text-sm text-gray-600">{course.name}</p>
        </div>
        <div className="flex space-x-2">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload CSV
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </button>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </button>
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No students found. Add your first student!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    College Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roll Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fees Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.college_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.roll_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.phone_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          student.fees_paid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {student.fees_paid ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openEditDialog(student)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student._id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Dialog */}
        {isAddDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Add New Student</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="Enter student name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                  <input
                    type="text"
                    value={newStudent.college_name}
                    onChange={(e) => setNewStudent({ ...newStudent, college_name: e.target.value })}
                    placeholder="Enter college name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    placeholder="Enter email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newStudent.department}
                    onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                    placeholder="Enter department"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={newStudent.roll_number}
                    onChange={(e) => setNewStudent({ ...newStudent, roll_number: e.target.value })}
                    placeholder="Enter roll number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newStudent.phone_number}
                    onChange={(e) => setNewStudent({ ...newStudent, phone_number: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="fees-paid"
                      checked={newStudent.fees_paid}
                      onChange={(e) => setNewStudent({ ...newStudent, fees_paid: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="fees-paid" className="text-sm font-medium text-gray-700">
                      Fees Paid
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2 mt-6">
                <button
                  onClick={handleAddStudent}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Add Student
                </button>
                <button
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setNewStudent({
                      name: "",
                      college_name: "",
                      email: "",
                      department: "",
                      roll_number: "",
                      phone_number: "",
                      fees_paid: false,
                    })
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        {isEditDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Edit Student</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="Enter student name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                  <input
                    type="text"
                    value={newStudent.college_name}
                    onChange={(e) => setNewStudent({ ...newStudent, college_name: e.target.value })}
                    placeholder="Enter college name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    placeholder="Enter email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newStudent.department}
                    onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                    placeholder="Enter department"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={newStudent.roll_number}
                    onChange={(e) => setNewStudent({ ...newStudent, roll_number: e.target.value })}
                    placeholder="Enter roll number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newStudent.phone_number}
                    onChange={(e) => setNewStudent({ ...newStudent, phone_number: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-fees-paid"
                      checked={newStudent.fees_paid}
                      onChange={(e) => setNewStudent({ ...newStudent, fees_paid: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit-fees-paid" className="text-sm font-medium text-gray-700">
                      Fees Paid
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2 mt-6">
                <button
                  onClick={handleEditStudent}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Update Student
                </button>
                <button
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingStudent(null)
                    setNewStudent({
                      name: "",
                      college_name: "",
                      email: "",
                      department: "",
                      roll_number: "",
                      phone_number: "",
                      fees_paid: false,
                    })
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
