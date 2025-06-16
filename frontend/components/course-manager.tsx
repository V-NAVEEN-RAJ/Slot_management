"use client"

import { useState, useEffect } from "react"
import { Folder, Plus, Edit, Trash2 } from "lucide-react"
import BatchManager from "./batch-manager"
import { apiClient } from "@/lib/api"

interface Course {
  _id: string
  name: string
  description: string
  year: string
}

interface CourseManagerProps {
  selectedYear: string
  onDataChange?: () => void
}

export default function CourseManager({ selectedYear, onDataChange }: CourseManagerProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [newCourse, setNewCourse] = useState({ name: "", description: "" })

  useEffect(() => {
    fetchCourses()
  }, [selectedYear])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getCourses(selectedYear)
      setCourses(data)
    } catch (error) {
      console.error("Error fetching courses:", error)
      alert("Failed to fetch courses")
    } finally {
      setLoading(false)
    }
  }

  const handleAddCourse = async () => {
    if (!newCourse.name || !newCourse.description) {
      alert("Please fill all fields")
      return
    }

    try {
      const course = await apiClient.createCourse({
        name: newCourse.name,
        description: newCourse.description,
        year: selectedYear,
      })
      setCourses([...courses, course])
      setNewCourse({ name: "", description: "" })
      setIsAddDialogOpen(false)
      onDataChange?.()
    } catch (error) {
      console.error("Error adding course:", error)
      alert("Failed to add course")
    }
  }

  const handleEditCourse = async () => {
    if (!editingCourse || !newCourse.name || !newCourse.description) {
      alert("Please fill all fields")
      return
    }

    try {
      const updatedCourse = await apiClient.updateCourse(editingCourse._id, {
        name: newCourse.name,
        description: newCourse.description,
      })
      setCourses(courses.map((c) => (c._id === editingCourse._id ? updatedCourse : c)))
      setIsEditDialogOpen(false)
      setEditingCourse(null)
      setNewCourse({ name: "", description: "" })
      onDataChange?.()
    } catch (error) {
      console.error("Error updating course:", error)
      alert("Failed to update course")
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return

    try {
      await apiClient.deleteCourse(courseId)
      setCourses(courses.filter((c) => c._id !== courseId))
      onDataChange?.()
    } catch (error) {
      console.error("Error deleting course:", error)
      alert("Failed to delete course")
    }
  }

  const openEditDialog = (course: Course) => {
    setEditingCourse(course)
    setNewCourse({ name: course.name, description: course.description })
    setIsEditDialogOpen(true)
  }

  if (selectedCourse) {
    return (
      <div>
        <button
          onClick={() => setSelectedCourse(null)}
          className="mb-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          ← Back to Courses
        </button>
        <BatchManager course={selectedCourse} onDataChange={onDataChange} />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center p-6 border-b">
        <h3 className="text-lg font-semibold">Courses for {selectedYear}</h3>
        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </button>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No courses found. Add your first course!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1" onClick={() => setSelectedCourse(course)}>
                    <Folder className="h-6 w-6 text-blue-600" />
                    <span className="font-medium">{course.name}</span>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditDialog(course)} className="p-1 text-gray-400 hover:text-gray-600">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course._id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{course.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Course</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                <input
                  type="text"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="Enter course name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Enter course description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddCourse}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Add Course
                </button>
                <button
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setNewCourse({ name: "", description: "" })
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Course</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                <input
                  type="text"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="Enter course name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Enter course description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleEditCourse}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Update Course
                </button>
                <button
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingCourse(null)
                    setNewCourse({ name: "", description: "" })
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
