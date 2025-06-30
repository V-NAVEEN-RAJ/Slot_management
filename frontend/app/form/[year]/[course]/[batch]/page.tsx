"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://slot-management-cn.onrender.com";

export default function StudentRegistrationForm() {
  const params = useParams();
  const { year, course, batch } = params as { year: string; course: string; batch: string };

  const [formData, setFormData] = useState({
    name: "",
    collegeName: "",
    email: "",
    department: "",
    rollNumber: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [courseInfo, setCourseInfo] = useState<{ courseName: string; batchName: string }>({ courseName: "", batchName: "" });
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    // Fetch course and batch info for display
    fetch(`${BACKEND_URL}/api/public/course-info/${year}/${course}/${batch}`)
      .then(res => res.json())
      .then(data => setCourseInfo(data))
      .catch(console.error);
  }, [year, course, batch]);

  // Name validation: Each word starts with capital, last word is single capital letter
  function validateName(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2) return "Name must include at least first name and initial.";
    for (let i = 0; i < parts.length - 1; i++) {
      if (!/^[A-Z][a-zA-Z]*$/.test(parts[i])) {
        return "Each name part must start with a capital letter.";
      }
    }
    if (!/^[A-Z]$/.test(parts[parts.length - 1])) {
      return "Last part must be a single capital letter (initial).";
    }
    return "";
  }

  // Stricter email format validation
  function validateEmailFormat(email: string) {
    // RFC 5322 Official Standard regex (simplified for practical use)
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!re.test(email)) {
      return "Enter a valid email address.";
    }
    return "";
  }

  // Email existence check
  async function checkEmailExists(email: string) {
    setEmailChecking(true);
    setEmailError("");
    setEmailExists(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/public/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.exists) {
        setEmailError("Email already registered.");
        setEmailExists(true);
      }
    } catch {
      setEmailError("Could not verify email. Try again.");
    } finally {
      setEmailChecking(false);
    }
  }

  function validatePhone(phone: string) {
    if (!/^\d{10}$/.test(phone)) {
      return "Phone number must be exactly 10 digits.";
    }
    return "";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/public/register/${year}/${course}/${batch}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            college_name: formData.collegeName,
            email: formData.email,
            department: formData.department,
            roll_number: formData.rollNumber,
            phone_number: formData.phoneNumber,
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to submit form");
      }
      setSuccess(true);
      setFormData({
        name: "",
        collegeName: "",
        email: "",
        department: "",
        rollNumber: "",
        phoneNumber: "",
      });
    } catch (err) {
      setError("Failed to submit form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (e.target.name === "name") {
      setNameError(validateName(e.target.value));
    }
    if (e.target.name === "email") {
      const formatError = validateEmailFormat(e.target.value);
      setEmailError(formatError);
      setEmailExists(false);
    }
    if (e.target.name === "phoneNumber") {
      setPhoneError(validatePhone(e.target.value));
    }
  };

  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value && !validateEmailFormat(e.target.value)) {
      checkEmailExists(e.target.value);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-2">Registration Successful!</h2>
            <p className="text-gray-600">Thank you for registering. We will contact you soon.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Student Registration
          </h2>
          {courseInfo.courseName && (
            <p className="mt-2 text-center text-sm text-gray-600">
              {courseInfo.courseName} - {courseInfo.batchName}
            </p>
          )}
          <p className="mt-2 text-center text-sm text-red-600 font-semibold">
            Please fill it carefully. This information will appear on the certificate.
          </p>
        </div>
        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {nameError && <p className="text-red-600 text-xs mt-1">{nameError}</p>}
            </div>
            <div>
              <label htmlFor="collegeName" className="block text-sm font-medium text-gray-700">
                College Name
              </label>
              <input
                id="collegeName"
                name="collegeName"
                type="text"
                required
                value={formData.collegeName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                onBlur={handleEmailBlur}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {emailChecking && <p className="text-gray-500 text-xs mt-1">Checking email...</p>}
              {emailError && <p className="text-red-600 text-xs mt-1">{emailError}</p>}
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <input
                id="department"
                name="department"
                type="text"
                required
                value={formData.department}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700">
                Roll Number
              </label>
              <input
                id="rollNumber"
                name="rollNumber"
                type="text"
                required
                value={formData.rollNumber}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {phoneError && <p className="text-red-600 text-xs mt-1">{phoneError}</p>}
            </div>
          </div>
          {error && (
            <div className="text-red-600 text-sm mt-2">
              {error}
            </div>
          )}
          <div>
            <button
              type="submit"
              disabled={loading || !!nameError || !!emailError || emailExists || !!phoneError}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
