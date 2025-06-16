const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://slot-management-cn.onrender.com"

class ApiClient {
  private getAuthHeaders() {
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  // Statistics API method
  async getStatistics(year: string) {
    const response = await fetch(`${API_BASE_URL}/statistics/${year}`, {
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to fetch statistics")
    return response.json()
  }

  // Admin API methods
  async getAdmins() {
    const response = await fetch(`${API_BASE_URL}/admins`, {
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to fetch admins")
    return response.json()
  }

  async createAdmin(admin: { username: string; password: string; email: string; role?: string }) {
    const response = await fetch(`${API_BASE_URL}/admins`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(admin),
    })
    if (!response.ok) throw new Error("Failed to create admin")
    return response.json()
  }

  async updatePassword(adminId: string, passwords: { currentPassword: string; newPassword: string }) {
    const response = await fetch(`${API_BASE_URL}/admins/${adminId}/password`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(passwords),
    })
    if (!response.ok) throw new Error("Failed to update password")
    return response.json()
  }

  async deleteAdmin(adminId: string) {
    const response = await fetch(`${API_BASE_URL}/admins/${adminId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to delete admin")
    return response.json()
  }

  // Student Filter API method
  async getStudentsByFilter(courseId: string) {
    const response = await fetch(`${API_BASE_URL}/students/filter/${courseId}`, {
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to fetch filtered students")
    return response.json()
  }

  // Course API methods
  async getCourses(year: string) {
    const response = await fetch(`${API_BASE_URL}/courses/${year}`, {
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to fetch courses")
    return response.json()
  }

  async createCourse(course: { name: string; description: string; year: string }) {
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(course),
    })
    if (!response.ok) throw new Error("Failed to create course")
    return response.json()
  }

  async updateCourse(id: string, course: { name: string; description: string }) {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(course),
    })
    if (!response.ok) throw new Error("Failed to update course")
    return response.json()
  }

  async deleteCourse(id: string) {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to delete course")
    return response.json()
  }

  // Batch API methods
  async getBatches(courseId: string) {
    const response = await fetch(`${API_BASE_URL}/batches/${courseId}`, {
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to fetch batches")
    return response.json()
  }

  async createBatch(batch: { name: string; description: string; status: string; courseId: string }) {
    const response = await fetch(`${API_BASE_URL}/batches`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(batch),
    })
    if (!response.ok) throw new Error("Failed to create batch")
    return response.json()
  }

  async updateBatch(id: string, batch: { name: string; description: string; status: string }) {
    const response = await fetch(`${API_BASE_URL}/batches/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(batch),
    })
    if (!response.ok) throw new Error("Failed to update batch")
    return response.json()
  }

  async deleteBatch(id: string) {
    const response = await fetch(`${API_BASE_URL}/batches/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to delete batch")
    return response.json()
  }

  // Student API methods
  async getStudents(batchId: string) {
    const response = await fetch(`${API_BASE_URL}/students/${batchId}`, {
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to fetch students")
    return response.json()
  }

  async createStudent(student: any) {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(student),
    })
    if (!response.ok) throw new Error("Failed to create student")
    return response.json()
  }

  async createStudentsBulk(students: any[]) {
    const response = await fetch(`${API_BASE_URL}/students/bulk`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ students }),
    })
    if (!response.ok) throw new Error("Failed to create students")
    return response.json()
  }

  async updateStudent(id: string, student: any) {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(student),
    })
    if (!response.ok) throw new Error("Failed to update student")
    return response.json()
  }

  async deleteStudent(id: string) {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to delete student")
    return response.json()
  }
}

export const apiClient = new ApiClient()
