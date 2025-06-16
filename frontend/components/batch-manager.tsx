"use client"

import { useState, useEffect } from "react"
import { Folder, Plus, Edit, Trash2 } from "lucide-react"
import StudentManager from "./student-manager"
import { apiClient } from "@/lib/api"

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

interface BatchManagerProps {
  course: Course
  onDataChange?: () => void
}

export default function BatchManager({ course, onDataChange }: BatchManagerProps) {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [newBatch, setNewBatch] = useState({ name: "", description: "", status: "ongoing" as "ongoing" | "completed" })

  useEffect(() => {
    fetchBatches()
  }, [course])

  const fetchBatches = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getBatches(course._id)
      setBatches(data)
    } catch (error) {
      console.error("Error fetching batches:", error)
      alert("Failed to fetch batches")
    } finally {
      setLoading(false)
    }
  }

  const handleAddBatch = async () => {
    if (!newBatch.name || !newBatch.description) {
      alert("Please fill all fields")
      return
    }

    try {
      const batchData = {
        name: newBatch.name,
        description: newBatch.description,
        status: newBatch.status,
        courseId: course._id,
      }
      await apiClient.createBatch(batchData)
      setNewBatch({ name: "", description: "", status: "ongoing" })
      setIsAddDialogOpen(false)
      fetchBatches()
      onDataChange?.()
    } catch (error) {
      console.error("Error creating batch:", error)
      alert("Failed to create batch")
    }
  }

  const handleEditBatch = async () => {
    if (!editingBatch || !newBatch.name || !newBatch.description) {
      alert("Please fill all fields")
      return
    }

    try {
      const batchData = {
        name: newBatch.name,
        description: newBatch.description,
        status: newBatch.status,
      }
      await apiClient.updateBatch(editingBatch._id, batchData)
      setIsEditDialogOpen(false)
      setEditingBatch(null)
      setNewBatch({ name: "", description: "", status: "ongoing" })
      fetchBatches()
      onDataChange?.()
    } catch (error) {
      console.error("Error updating batch:", error)
      alert("Failed to update batch")
    }
  }

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm("Are you sure you want to delete this batch?")) return

    try {
      await apiClient.deleteBatch(batchId)
      fetchBatches()
      onDataChange?.()
    } catch (error) {
      console.error("Error deleting batch:", error)
      alert("Failed to delete batch")
    }
  }

  const openEditDialog = (batch: Batch) => {
    setEditingBatch(batch)
    setNewBatch({ name: batch.name, description: batch.description, status: batch.status })
    setIsEditDialogOpen(true)
  }

  if (selectedBatch) {
    return (
      <div>
        <button
          onClick={() => setSelectedBatch(null)}
          className="mb-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          ← Back to Batches
        </button>
        <StudentManager batch={selectedBatch} course={course} onDataChange={onDataChange} />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center p-6 border-b">
        <h3 className="text-lg font-semibold">Batches for {course.name}</h3>
        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Batch
        </button>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">Loading batches...</div>
        ) : batches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No batches found. Add your first batch!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => (
              <div
                key={batch._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1" onClick={() => setSelectedBatch(batch)}>
                    <Folder className="h-6 w-6 text-green-600" />
                    <span className="font-medium">{batch.name}</span>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditDialog(batch)} className="p-1 text-gray-400 hover:text-gray-600">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBatch(batch._id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{batch.description}</p>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                    batch.status === "ongoing" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {batch.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Batch</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
                <input
                  type="text"
                  value={newBatch.name}
                  onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                  placeholder="Enter batch name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newBatch.description}
                  onChange={(e) => setNewBatch({ ...newBatch, description: e.target.value })}
                  placeholder="Enter batch description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newBatch.status}
                  onChange={(e) => setNewBatch({ ...newBatch, status: e.target.value as "ongoing" | "completed" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddBatch}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Add Batch
                </button>
                <button
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setNewBatch({ name: "", description: "", status: "ongoing" })
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
            <h3 className="text-lg font-semibold mb-4">Edit Batch</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
                <input
                  type="text"
                  value={newBatch.name}
                  onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                  placeholder="Enter batch name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newBatch.description}
                  onChange={(e) => setNewBatch({ ...newBatch, description: e.target.value })}
                  placeholder="Enter batch description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newBatch.status}
                  onChange={(e) => setNewBatch({ ...newBatch, status: e.target.value as "ongoing" | "completed" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleEditBatch}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Update Batch
                </button>
                <button
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingBatch(null)
                    setNewBatch({ name: "", description: "", status: "ongoing" })
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
