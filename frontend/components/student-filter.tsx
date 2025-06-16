"use client"

import { useState, useEffect } from "react"
import { Search, Download, Users, GraduationCap } from "lucide-react"
import { downloadExcel } from "@/lib/excel-utils"
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
  batchId: {
    _id: string
    name: string
  }
}

interface BatchData {
  batchId: string
  batchName: string
  batchDescription: string
  batchStatus: string
  students: Student[]
}

interface FilterData {
  courseId: string
  totalStudents: number
  batches: BatchData[]
}

interface Course {
  _id: string
  name: string
  description: string
}

interface StudentFilterProps {
  selectedYear: string
}

export default function StudentFilter({ selectedYear }: StudentFilterProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [filterData, setFilterData] = useState<FilterData | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchCourses()
  }, [selectedYear])

  const fetchCourses = async () => {
    try {
      const data = await apiClient.getCourses(selectedYear)
      setCourses(data)
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const handleCourseSelect = async (courseId: string) => {
    setSelectedCourse(courseId)
    if (!courseId) {
      setFilterData(null)
      return
    }

    try {
      setLoading(true)
      const data = await apiClient.getStudentsByFilter(courseId)
      setFilterData(data)
    } catch (error) {
      console.error("Error fetching filtered students:", error)
      alert("Failed to fetch students")
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents =
    filterData?.batches.flatMap((batch) =>
      batch.students.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          batch.batchName.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    ) || []

  const handleDownloadAll = () => {
    if (!filterData) return

    const allStudents = filterData.batches.flatMap((batch) =>
      batch.students.map((student) => ({
        name: student.name,
        college_name: student.college_name,
        email: student.email,
        department: student.department,
        roll_number: student.roll_number,
        phone_number: student.phone_number,
        fees_paid: student.fees_paid,
        batch_name: batch.batchName,
        batch_status: batch.batchStatus,
      })),
    )

    const selectedCourseName = courses.find((c) => c._id === selectedCourse)?.name || "Course"
    downloadExcel(allStudents, `${selectedCourseName}_All_Students.csv`)
  }

  const handleDownloadBatch = (batch: BatchData) => {
    const batchStudents = batch.students.map((student) => ({
      name: student.name,
      college_name: student.college_name,
      email: student.email,
      department: student.department,
      roll_number: student.roll_number,
      phone_number: student.phone_number,
      fees_paid: student.fees_paid,
    }))

    const selectedCourseName = courses.find((c) => c._id === selectedCourse)?.name || "Course"
    downloadExcel(batchStudents, `${selectedCourseName}_${batch.batchName}_Students.csv`)
  }

  return (
    <div className="space-y-6">
      {/* Course Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Filter Students by Course</h3>
        <div className="flex items-center space-x-4">
          <label htmlFor="course-select" className="text-sm font-medium text-gray-700">
            Select Course:
          </label>
          <select
            id="course-select"
            value={selectedCourse}
            onChange={(e) => handleCourseSelect(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search and Summary */}
      {filterData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Students in {courses.find((c) => c._id === selectedCourse)?.name}</h3>
            <button
              onClick={handleDownloadAll}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search students by name, email, roll number, department, or batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Total Students</p>
                  <p className="text-2xl font-bold text-blue-900">{filterData.totalStudents}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <GraduationCap className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Total Batches</p>
                  <p className="text-2xl font-bold text-green-900">{filterData.batches.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <Search className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">Filtered Results</p>
                  <p className="text-2xl font-bold text-purple-900">{filteredStudents.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">Loading students...</div>
        </div>
      )}

      {/* Batch-wise Student Display */}
      {filterData && !loading && (
        <div className="space-y-6">
          {filterData.batches.map((batch) => {
            const batchFilteredStudents = batch.students.filter(
              (student) =>
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                batch.batchName.toLowerCase().includes(searchTerm.toLowerCase()),
            )

            if (searchTerm && batchFilteredStudents.length === 0) return null

            return (
              <div key={batch.batchId} className="bg-white rounded-lg shadow-md">
                <div className="flex justify-between items-center p-6 border-b">
                  <div>
                    <h4 className="text-lg font-semibold">{batch.batchName}</h4>
                    <p className="text-sm text-gray-600">{batch.batchDescription}</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                        batch.batchStatus === "ongoing" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {batch.batchStatus}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {batchFilteredStudents.length} students
                      {searchTerm &&
                        batchFilteredStudents.length !== batch.students.length &&
                        ` (${batch.students.length} total)`}
                    </span>
                    <button
                      onClick={() => handleDownloadBatch(batch)}
                      className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {batchFilteredStudents.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No students found in this batch</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              College
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
                              Phone
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fees
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {batchFilteredStudents.map((student) => (
                            <tr key={student._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {student.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.college_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.department}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.roll_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.phone_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    student.fees_paid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {student.fees_paid ? "Paid" : "Pending"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* No Data State */}
      {!selectedCourse && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-gray-500">Please select a course to view students</div>
        </div>
      )}
    </div>
  )
}
