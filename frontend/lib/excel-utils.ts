// Chrome-compatible Excel utility functions
export const downloadExcel = (data: any[], filename: string) => {
  // Convert data to CSV format (Chrome compatible)
  const csvContent = convertToCSV(data)
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

  // Create download link
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", filename.replace(".xlsx", ".csv"))
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const convertToCSV = (data: any[]): string => {
  if (!data || data.length === 0) return ""

  // Get headers from first object
  const headers = Object.keys(data[0])

  // Create CSV content
  const csvRows = []

  // Add headers
  csvRows.push(headers.join(","))

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header]
      // Escape commas and quotes
      if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
    csvRows.push(values.join(","))
  }

  return csvRows.join("\n")
}

export const readExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const data = parseCSV(text)
        resolve(data)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Failed to read file"))

    // Read as text for CSV files
    if (file.name.endsWith(".csv")) {
      reader.readAsText(file)
    } else {
      // For Excel files, we'll ask user to convert to CSV
      reject(new Error("Please convert Excel file to CSV format for better compatibility"))
    }
  })
}

const parseCSV = (text: string): any[] => {
  const lines = text.split("\n")
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim())
  const data = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(",").map((v) => v.trim())
    const obj: any = {}

    headers.forEach((header, index) => {
      obj[header] = values[index] || ""
    })

    data.push(obj)
  }

  return data
}
