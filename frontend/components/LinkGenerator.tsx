import { useEffect, useState } from "react"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://slot-management-cn.onrender.com"

interface Course {
  _id: string
  name: string
}

interface Batch {
  _id: string
  name: string
}

export default function LinkGenerator({ selectedYear }: { selectedYear: string }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedBatch, setSelectedBatch] = useState("")
  const [link, setLink] = useState("")

  useEffect(() => {
    if (!selectedYear) return
    const token = localStorage.getItem("token")
    fetch(`${BACKEND_URL}/api/courses/${selectedYear}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setCourses)
      .catch(console.error)
  }, [selectedYear])

  useEffect(() => {
    if (!selectedCourse) return
    const token = localStorage.getItem("token")
    fetch(`${BACKEND_URL}/api/batches/${selectedCourse}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setBatches)
      .catch(console.error)
  }, [selectedCourse])

  const handleGenerate = () => {
    const url = `${window.location.origin}/form/${selectedYear}/${selectedCourse}/${selectedBatch}`
    setLink(url)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
      <h3 className="text-xl font-semibold mb-4">Generate Public Link</h3>

      <div className="space-y-4">
        <select
          className="w-full border rounded p-2"
          value={selectedCourse}
          onChange={(e) => {
            setSelectedCourse(e.target.value)
            setSelectedBatch("")
            setLink("")
          }}
        >
          <option value="">-- Select Course --</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        {selectedCourse && (
          <select
            className="w-full border rounded p-2"
            value={selectedBatch}
            onChange={(e) => {
              setSelectedBatch(e.target.value)
              setLink("")
            }}
          >
            <option value="">-- Select Batch --</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={handleGenerate}
          disabled={!selectedBatch}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Generate Link
        </button>

        {link && (
          <div className="bg-gray-100 p-4 rounded mt-4">
            <p className="break-all text-blue-700 font-mono mb-2">{link}</p>
            <button
              onClick={() => navigator.clipboard.writeText(link)}
              className="bg-green-600 text-white px-4 py-1 rounded"
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
