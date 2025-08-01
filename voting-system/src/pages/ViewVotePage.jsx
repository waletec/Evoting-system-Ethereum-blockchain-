import React from 'react';

"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, ArrowLeft, CheckCircle, AlertTriangle, Loader2, Shield, Vote, User } from "lucide-react"
import { viewVote } from "../api"

const ViewVotePage = () => {
  const [matricNumber, setMatricNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [voteData, setVoteData] = useState(null)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleViewVote = async (e) => {
    e.preventDefault()
    
    if (!matricNumber.trim()) {
      setError("Please enter your matric number")
      return
    }

    try {
      setLoading(true)
      setError("")
      setVoteData(null)

      const data = await viewVote(matricNumber.trim())
      setVoteData(data)
    } catch (error) {
      console.error("Failed to view vote:", error)
      setError(error.error || "Failed to retrieve vote. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBackToHome = () => {
    navigate("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToHome}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">View Your Vote</h1>
                <p className="text-sm text-gray-500">Check your voting record</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Secure Verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Search Form */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Find Your Vote</h2>
                  <p className="text-gray-600">Enter your matric number to view your voting record</p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleViewVote} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Searching...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Eye className="h-5 w-5" />
                      <span>View Vote</span>
                    </div>
                  )}
                </button>
              </form>
            </div>

            {/* Information */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How it works</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Enter your matric number</p>
                    <p className="text-sm text-gray-600">Use the same matric number you used during registration</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Verify your vote</p>
                    <p className="text-sm text-gray-600">View the candidate you voted for and when you voted</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Secure verification</p>
                    <p className="text-sm text-gray-600">Your vote is verified against the blockchain record</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {voteData ? (
              /* Vote Details */
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Vote Found!</h2>
                    <p className="text-gray-600">Your voting record has been verified</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Vote className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">Vote Confirmed</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Your vote has been successfully recorded and verified on the blockchain.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Voter ID:</span>
                      <span className="text-sm text-gray-900">{voteData.voterId}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Candidate:</span>
                      <span className="text-sm text-gray-900 font-semibold">{voteData.candidate}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Vote Time:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(voteData.timestamp * 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Blockchain Verification</h4>
                        <p className="text-sm text-blue-700">
                          This vote has been permanently recorded on the blockchain and cannot be altered or deleted.
                          Your vote remains anonymous and secure.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Placeholder */
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vote Data</h3>
                  <p className="text-gray-600">
                    Enter your matric number above to view your voting record.
                  </p>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-green-600 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy & Security</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• Your vote is anonymous and cannot be traced back to you</p>
                    <p>• Only you can view your own voting record</p>
                    <p>• All votes are encrypted and stored on the blockchain</p>
                    <p>• The system ensures complete vote integrity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>
  )
}

export default ViewVotePage 