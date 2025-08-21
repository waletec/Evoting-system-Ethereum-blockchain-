import React from 'react';

"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, ArrowLeft, CheckCircle, AlertTriangle, Loader2, Shield, Vote, User } from "lucide-react"
import { viewVote, getBlockchainStatus } from "../api"
import BlockchainStatus from "../components/BlockchainStatus"

const ViewVotePage = () => {
  const [votingCode, setVotingCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [voteData, setVoteData] = useState(null)
  const [error, setError] = useState("")
  const [blockchainStatus, setBlockchainStatus] = useState("checking")
  const navigate = useNavigate()

  const handleViewVote = async (e) => {
    e.preventDefault()
    
    if (!votingCode.trim()) {
      setError("Please enter your voting code")
      return
    }

    try {
      setLoading(true)
      setError("")
      setVoteData(null)

      // Check blockchain status first
      try {
        const blockchainResponse = await getBlockchainStatus();
        setBlockchainStatus(blockchainResponse.status);
        console.log('🔗 Blockchain status:', blockchainResponse.status);
      } catch (blockchainError) {
        console.error('❌ Failed to check blockchain status:', blockchainError);
        setBlockchainStatus('disconnected');
      }

      const data = await viewVote(votingCode.trim())
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
            <div className="flex items-center space-x-4">
              <BlockchainStatus showDetails={false} />
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Secure Verification</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
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
                  <p className="text-gray-600">Enter your voting code to view your voting record</p>
                </div>
              </div>

              <form onSubmit={handleViewVote} className="space-y-4">
                <div>
                  <label htmlFor="votingCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Voting Code
                  </label>
                  <input
                    type="text"
                    id="votingCode"
                    value={votingCode}
                    onChange={(e) => setVotingCode(e.target.value)}
                    placeholder="Enter your voting code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-800">{error}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-5 w-5" />
                      <span>View Vote</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Information */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How it works</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Verify Your Vote</h4>
                    <p className="text-sm text-gray-600">Paste the voting code you received during registration to view your voting record</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Check Vote Integrity</h4>
                    <p className="text-sm text-gray-600">Ensure your voting information and choices were not altered after submission</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Blockchain Verification</h4>
                    <p className="text-sm text-gray-600">Your vote is verified against the immutable blockchain record for complete transparency</p>
                  </div>
                </div>
              </div>

              {/* Privacy & Security moved here */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Privacy & Security</h4>
                    <div className="space-y-1 text-xs text-blue-700">
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

          {/* Right Column - Results (Wider) */}
          <div className="lg:col-span-2 space-y-6">
            {voteData ? (
              /* Vote Details - Wider Layout */
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

                <div className="space-y-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Vote className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">Vote Confirmed</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Your vote has been successfully recorded and verified on the blockchain.
                    </p>
                  </div>

                  {/* Similar data arranged side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <span className="text-sm font-medium text-gray-700 block mb-1">Matric Number</span>
                        <span className="text-lg font-bold text-gray-900">{voteData.votes?.[0]?.matricNumber || voteData.matricNumber}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <span className="text-sm font-medium text-gray-700 block mb-1">Total Votes Cast</span>
                        <span className="text-lg font-bold text-gray-900">{voteData.totalVotes || 1}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <span className="text-sm font-medium text-gray-700 block mb-1">Vote Time</span>
                        <span className="text-sm font-bold text-gray-900">
                          {voteData.votes?.[0]?.timestamp ? new Date(voteData.votes[0].timestamp).toLocaleString() : 
                           voteData.timestamp ? new Date(voteData.timestamp).toLocaleString() : 'Not available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Vote records in block format */}
                  {voteData.votes && voteData.votes.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Your Votes by Position</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {voteData.votes.map((vote, index) => (
                          <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-blue-900">{vote.position}</span>
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                {vote.timestamp ? new Date(vote.timestamp).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            <p className="text-lg font-semibold text-blue-800">{vote.candidate}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
                    Enter your generated code above to view your voting record.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  </div>
  )
}

export default ViewVotePage 