"use client"

import { useState, useEffect, useCallback } from "react"
import { LogOut, User, BookOpen, Users, GraduationCap, DollarSign, TrendingUp, Settings, Filter } from "lucide-react"
import CourseManager from "@/components/course-manager"
import AdminManager from "@/components/admin-manager"
import StudentFilter from "@/components/student-filter"

interface Statistics {
  totalCourses: number
  totalBatches: number
  totalStudents: number
  paidStudents: number
  unpaidStudents: number
  courses: Array<{
    id: string
    name: string
    description: string
    batchCount: number
  }>
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://slot-management-cn.onrender.com"

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [years, setYears] = useState<string[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentView, setCurrentView] = useState<"courses" | "admin" | "filter">("courses")
  const [admin, setAdmin] = useState<any>(null)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token")
    const adminData = localStorage.getItem("admin")

    if (!token || !adminData) {
      window.location.href = "/"
      return
    }

    setAdmin(JSON.parse(adminData))

    // Generate years from current year to next 5 years
    const currentYear = new Date().getFullYear()
    const yearList = []
    for (let i = 0; i < 6; i++) {
      yearList.push((currentYear + i).toString())
    }
    setYears(yearList)
  }, [])

  const fetchStatistics = useCallback(async () => {
    if (!selectedYear) return

    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/api/statistics/${selectedYear}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch statistics")
      }

      const data = await response.json()
      setStatistics(data)
    } catch (error) {
      console.error("Error fetching statistics:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedYear])

  useEffect(() => {
    fetchStatistics()
  }, [fetchStatistics])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("admin")
    window.location.href = "/"
  }

  const refreshStatistics = () => {
    fetchStatistics()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <User className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Slot Booking System</h1>
              {admin && (
                <span className="text-sm text-gray-500">
                  Welcome, {admin.username}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {/* Navigation Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentView("courses")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === "courses" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <BookOpen className="h-4 w-4 inline mr-1" />
                  Courses
                </button>
                <button
                  onClick={() => setCurrentView("filter")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === "filter" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Filter className="h-4 w-4 inline mr-1" />
                  Filter Students
                </button>
                {/* <button
                  onClick={() => setCurrentView("admin")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === "admin" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Settings className="h-4 w-4 inline mr-1" />
                  Admin
                </button> */}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">Welcome to Slot Booking System</h2>
            <p className="text-gray-600 mb-4">Select an academic year to manage courses and batches</p>
            <div className="flex items-center space-x-4">
              <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
                Academic Year:
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        {selectedYear && currentView === "courses" && (
          <div className="mb-8">
            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">Loading statistics...</div>
              </div>
            ) : statistics ? (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Courses</p>
                        <p className="text-2xl font-bold text-gray-900">{statistics.totalCourses}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Users className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Batches</p>
                        <p className="text-2xl font-bold text-gray-900">{statistics.totalBatches}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <GraduationCap className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900">{statistics.totalStudents}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DollarSign className="h-8 w-8 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Fees Collection</p>
                        <p className="text-lg font-bold text-green-600">{statistics.paidStudents} Paid</p>
                        <p className="text-sm text-red-600">{statistics.unpaidStudents} Pending</p>
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center text-gray-500">
                  No data available for {selectedYear}. Start by adding courses!
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content based on current view */}
        {currentView === "courses" && selectedYear && (
          <CourseManager selectedYear={selectedYear} onDataChange={refreshStatistics} />
        )}

        {currentView === "filter" && selectedYear && <StudentFilter selectedYear={selectedYear} />}

        {currentView === "admin" && <AdminManager />}
      </main>
    </div>
  )
}
