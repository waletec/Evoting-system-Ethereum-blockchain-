import React from 'react';
"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Vote, User, Shield, CheckCircle, ArrowRight, Clock, Users, Lock, Eye, EyeOff, X, Loader2, BarChart3, AlertTriangle } from "lucide-react"
import { registerVoter, checkHealth } from "../api"

const LandingPage = () => {
  const [election, setElection] = useState(null)
  const [matricNumber, setMatricNumber] = useState("")
  const [surname, setSurname] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [showCode, setShowCode] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [timeRemaining, setTimeRemaining] = useState("")
  const [systemStatus, setSystemStatus] = useState("checking")

  const navigate = useNavigate()

  useEffect(() => {
    checkSystemHealth()
    loadActiveElection()
  }, [])

  useEffect(() => {
    if (election) {
      const timer = setInterval(() => {
        updateTimeRemaining()
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [election])

  const checkSystemHealth = async () => {
    try {
      const health = await checkHealth()
      setSystemStatus("online")
    } catch (error) {
      setSystemStatus("offline")
      console.error("Backend health check failed:", error)
    }
  }

  const loadActiveElection = async () => {
    try {
      setLoading(true)
      // For now, we'll use a simple election object
      // In the future, this could come from an API endpoint
      const mockElection = {
        id: 1,
        title: "Student Union Election 2024",
        description: "Annual student union leadership election for academic year 2024-2025",
        startDate: "2024-03-01T09:00:00Z",
        endDate: "2024-12-31T17:00:00Z", // Extended for testing
        status: "active",
        totalVoters: 1250,
        totalVotes: 892,
      }

      setElection(mockElection)
    } catch (error) {
      console.error("Failed to load election:", error)
      setError("Failed to load election information")
    } finally {
      setLoading(false)
    }
  }

  const updateTimeRemaining = () => {
    if (!election) return

    const now = new Date().getTime()
    const endTime = new Date(election.endDate).getTime()
    const difference = endTime - now

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m remaining`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s remaining`)
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s remaining`)
      }
    } else {
      setTimeRemaining("Election ended")
    }
  }

  const handleGenerateCode = async () => {
    if (!matricNumber.trim() || !surname.trim()) {
      setError("Please enter both matric number and surname")
      return
    }

    try {
      setGenerating(true)
      setError("")
      setSuccess("")

      // Use the backend API
      const data = await registerVoter(matricNumber.trim(), surname.trim())
      
      setGeneratedCode(data.code)
      setSuccess("Registration successful! Use your code to vote.")
      setShowCode(true)

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000)
    } catch (error) {
      console.error("Failed to generate code:", error)
      setError(error.error || "Registration failed. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError("Please enter your voting code")
      return
    }

    try {
      setVerifying(true)
      setError("")

      // Store voter data in localStorage for the voting session
      localStorage.setItem(
        "voterSession",
        JSON.stringify({
          code: verificationCode,
          matricNumber: matricNumber,
          timestamp: new Date().toISOString(),
        }),
      )

      // Navigate to voting page
      navigate("/vote")
    } catch (error) {
      console.error("Failed to verify code:", error)
      setError("Invalid voting code. Please try again.")
    } finally {
      setVerifying(false)
    }
  }

  const handleProceedToVote = () => {
    if (!generatedCode) {
      setError("Please generate your voting code first")
      return
    }

    // Store the generated code and proceed to voting
    localStorage.setItem(
      "voterSession",
      JSON.stringify({
        code: generatedCode,
        matricNumber: matricNumber,
        timestamp: new Date().toISOString(),
      }),
    )

    navigate("/vote")
  }

  const copyCodeToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode)
      setSuccess("Code copied to clipboard!")
      setTimeout(() => setSuccess(""), 2000)
    }
  }

  const clearError = () => setError("")
  const clearSuccess = () => setSuccess("")

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading election information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Vote className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">E-Voting System</h1>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${systemStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-500">
                    {systemStatus === 'online' ? 'System Online' : 'System Offline'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/result")}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <BarChart3 className="h-5 w-5" />
                <span>View Results</span>
              </button>
              <button
                onClick={() => navigate("/admin/login")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 transition-colors"
              >
                <Shield className="h-5 w-5" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Election Info */}
          <div className="space-y-6">
            {election && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{election.title}</h2>
                    <p className="text-gray-600">{election.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Time Remaining</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-900">{timeRemaining}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Users className="h-5 w-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Total Voters</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{election.totalVoters}</span>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Vote className="h-5 w-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Votes Cast</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{election.totalVotes}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/result")}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">View Real-time Results</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-blue-600" />
                </button>
                <button
                  onClick={() => navigate("/view-vote")}
                  className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Eye className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">View My Vote</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-green-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Registration Form */}
          <div className="space-y-6">
            {/* Registration Form */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Register to Vote</h2>
                  <p className="text-gray-600">Enter your details to get your voting code</p>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="text-red-800">{error}</span>
                    </div>
                    <button onClick={clearError} className="text-red-600 hover:text-red-800">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-800">{success}</span>
                    </div>
                    <button onClick={clearSuccess} className="text-green-600 hover:text-green-800">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Registration Form */}
              {!showCode ? (
                <form onSubmit={(e) => { e.preventDefault(); handleGenerateCode(); }} className="space-y-4">
                  <div>
                    <label htmlFor="matricNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Matric Number
                    </label>
                    <input
                      type="text"
                      id="matricNumber"
                      value={matricNumber}
                      onChange={(e) => setMatricNumber(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your matric number"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-2">
                      Surname
                    </label>
                    <input
                      type="text"
                      id="surname"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your surname"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {generating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Generating Code...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Vote className="h-5 w-5" />
                        <span>Generate Voting Code</span>
                      </div>
                    )}
                  </button>
                </form>
              ) : (
                /* Generated Code Display */
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">Your Voting Code</span>
                      <button
                        onClick={copyCodeToClipboard}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="text-lg font-mono font-bold text-blue-900 bg-white px-3 py-2 rounded border">
                        {generatedCode}
                      </code>
                    </div>
                    <p className="text-sm text-blue-700 mt-2">
                      Keep this code safe. You'll need it to cast your vote.
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleProceedToVote}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <ArrowRight className="h-5 w-5" />
                        <span>Proceed to Vote</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowCode(false)
                        setGeneratedCode("")
                        setSuccess("")
                      }}
                      className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Code Verification */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Lock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Already Have a Code?</h3>
                  <p className="text-gray-600">Enter your code to proceed to voting</p>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your voting code"
                />
                <button
                  onClick={handleVerifyCode}
                  disabled={verifying}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {verifying ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="h-5 w-5" />
                      <span>Verify & Vote</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage 