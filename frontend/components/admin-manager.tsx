"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Key, User, Shield } from "lucide-react"
import { apiClient } from "@/lib/api"

interface Admin {
  _id: string
  username: string
  email: string
  role: string
  createdAt: string
}

export default function AdminManager() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [currentAdmin, setCurrentAdmin] = useState<any>(null)

  const [newAdmin, setNewAdmin] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const adminData = localStorage.getItem("admin")
    if (adminData) {
      setCurrentAdmin(JSON.parse(adminData))
    }
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAdmins()
      setAdmins(data)
    } catch (error) {
      console.error("Error fetching admins:", error)
      alert("Failed to fetch admins")
    } finally {
      setLoading(false)
    }
  }

  const handleAddAdmin = async () => {
    if (!newAdmin.username || !newAdmin.email || !newAdmin.password) {
      alert("Please fill all fields")
      return
    }

    try {
      const admin = await apiClient.createAdmin(newAdmin)
      setAdmins([...admins, admin])
      setNewAdmin({ username: "", email: "", password: "", role: "admin" })
      setIsAddDialogOpen(false)
      alert("Admin created successfully!")
    } catch (error) {
      console.error("Error creating admin:", error)
      alert("Failed to create admin")
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to delete this admin?")) return

    try {
      await apiClient.deleteAdmin(adminId)
      setAdmins(admins.filter((a) => a._id !== adminId))
      alert("Admin deleted successfully!")
    } catch (error) {
      console.error("Error deleting admin:", error)
      alert("Failed to delete admin")
    }
  }

  const handleUpdatePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert("Please fill all fields")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      alert("New password must be at least 6 characters long")
      return
    }

    try {
      await apiClient.updatePassword(selectedAdmin!._id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      setIsPasswordDialogOpen(false)
      setSelectedAdmin(null)
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      alert("Password updated successfully!")
    } catch (error) {
      console.error("Error updating password:", error)
      alert("Failed to update password")
    }
  }

  const openPasswordDialog = (admin: Admin) => {
    setSelectedAdmin(admin)
    setIsPasswordDialogOpen(true)
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center p-6 border-b">
        <h3 className="text-lg font-semibold">Admin Management</h3>
        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Admin
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">Loading admins...</div>
        ) : admins.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No admins found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{admin.username}</div>
                          <div className="text-sm text-gray-500">{admin.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          admin.role === "super_admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openPasswordDialog(admin)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Change Password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        {currentAdmin?._id !== admin._id && (
                          <button
                            onClick={() => handleDeleteAdmin(admin._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Admin"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Admin Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Admin</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                  placeholder="Enter username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder="Enter email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddAdmin}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Add Admin
                </button>
                <button
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setNewAdmin({ username: "", email: "", password: "", role: "admin" })
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

      {/* Change Password Dialog */}
      {isPasswordDialogOpen && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Change Password for {selectedAdmin.username}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleUpdatePassword}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Update Password
                </button>
                <button
                  onClick={() => {
                    setIsPasswordDialogOpen(false)
                    setSelectedAdmin(null)
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
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
