import React from 'react';
"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { User, Shield, CheckCircle, Clock, Users, Lock, Eye, EyeOff, X, Loader2, BarChart3, AlertTriangle, Vote, ArrowRight } from "lucide-react"
import { verifyVotingCode, registerVoter, checkHealth, getCurrentElectionInfo, getBlockchainStatus } from "../api"
import BlockchainStatus from "../components/BlockchainStatus"

const LandingPage = () => {
  const [election, setElection] = useState(null)
  const [matricNumber, setMatricNumber] = useState("")
  const [surname, setSurname] = useState("")
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState("")
  const [showCode, setShowCode] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [timeRemaining, setTimeRemaining] = useState("")
  const [systemStatus, setSystemStatus] = useState("checking")
  const [blockchainStatus, setBlockchainStatus] = useState("checking")

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
      
      // Check blockchain status
      try {
        const blockchainResponse = await getBlockchainStatus();
        setBlockchainStatus(blockchainResponse.status);
        console.log('🔗 Blockchain status:', blockchainResponse.status);
      } catch (blockchainError) {
        console.error('❌ Failed to check blockchain status:', blockchainError);
        setBlockchainStatus('disconnected');
      }
    } catch (error) {
      setSystemStatus("offline")
      console.error("Backend health check failed:", error)
    }
  }

  const loadActiveElection = async () => {
    try {
      setLoading(true)
      
      // Try to fetch election data from the database
      try {
        console.log("🔄 Making API call to getCurrentElectionInfo...")
        const response = await getCurrentElectionInfo()
        console.log("✅ API Response received:", response)
        
        if (response.success && response.election) {
          const electionData = response.election
          const startDate = electionData.startDate ? new Date(electionData.startDate) : new Date("2024-12-31T09:00:00Z");
          const endDate = electionData.endDate ? new Date(electionData.endDate) : new Date(startDate.getTime() + 12 * 60 * 60 * 1000);
          const election = {
            id: 1,
            title: electionData.title || "Election title not set",
            description: electionData.description || "description not set",
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            status: electionData.status || "draft",
            totalVoters: electionData.totalVoters || 0,
            totalVotes: electionData.totalVotes || 0,
          }
          setElection(election)
        } else {
          // No active election found - set a default inactive election
          const defaultElection = {
            id: null,
            title: "No Active Election",
            description: "There is currently no active election",
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            status: "inactive",
            totalVoters: 0,
            totalVotes: 0,
          }
          setElection(defaultElection)
          setSuccess("No active election at this time. Please check back later.")
        }
      } catch (apiError) {
        console.error("❌ Failed to fetch election from API:", apiError)
        
        // Check if it's a "no election found" error
        if (apiError.error === 'No election found') {
          const defaultElection = {
            id: null,
            title: "No Active Election",
            description: "There is currently no active election",
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            status: "inactive",
            totalVoters: 0,
            totalVotes: 0,
          }
          setElection(defaultElection)
          setSuccess("No active election at this time. Please check back later.")
        } else {
          console.error("🔍 API Error details:", {
            message: apiError.message,
            status: apiError.response?.status,
            data: apiError.response?.data,
            stack: apiError.stack
          })
          setError("Failed to load election information. Please try again later.")
        }
      }
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



  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError("Please enter your voting code")
      return
    }

    try {
      setVerifying(true)
      setError("")

      // Verify the code with the backend
      const response = await verifyVotingCode(verificationCode, matricNumber)
      
      if (response.success) {
        const sessionData = {
          code: verificationCode,
          matricNumber: matricNumber,
          timestamp: new Date().toISOString(),
        }
        
        // Store voter data in localStorage for the voting session
        localStorage.setItem("voterSession", JSON.stringify(sessionData))

        // Automatically navigate to voting page
        navigate("/vote")
      } else {
        setError(response.error || "Verification failed")
      }
    } catch (error) {
      console.error("Failed to verify code:", error)
      setError(error.error || "Failed to verify code. Please try again.")
    } finally {
      setVerifying(false)
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
      
      const response = await registerVoter(matricNumber.trim(), surname.trim())
      
      if (response.success || response.code) {
        setGeneratedCode(response.code)
        setShowCode(true)
        setSuccess(response.message || "Code generated successfully! Please save this code.")
        // Store the matric number before clearing the form
        const currentMatricNumber = matricNumber.trim()
        const currentSurname = surname.trim()
        setMatricNumber("")
        setSurname("")
        
        // Store voter session immediately after successful code generation
        localStorage.setItem('voterSession', JSON.stringify({
          matricNumber: currentMatricNumber,
          code: response.code,
          verified: true
        }))
      } else {
        setError(response.error || "Failed to generate code")
      }
    } catch (error) {
      console.error("Failed to generate code:", error)
      setError(error.error || "Failed to generate code. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const handleProceedToVote = () => {
    if (generatedCode) {
      // The voter session is already stored in handleGenerateCode
      // Just navigate to voting page
      navigate("/vote")
    }
  }

  const copyCodeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      setSuccess("Code copied to clipboard!")
    } catch (error) {
      console.error("Failed to copy code:", error)
      setError("Failed to copy code to clipboard")
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
                <h1 className="text-xl font-bold text-gray-900">Blockchain Voting System</h1>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">by Hammed Olawale E (Whaletech)</span>
                  <div className={`w-2 h-2 rounded-full ${systemStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-500">
                    {systemStatus === 'online' ? 'System Online' : 'System Offline'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <BlockchainStatus showDetails={false} />
              <button
                onClick={() => navigate("/result")}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <BarChart3 className="h-5 w-5" />
                <span>View Results</span>
              </button>
              <a
                href="/admin-login"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 transition-colors"
              >
                <Shield className="h-5 w-5" />
                <span>Admin</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Election Info */}
          <div className="space-y-6">
            {election && election.status === 'active' ? (
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
            ) : (
              /* No Active Election Message */
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="text-center">
                  <div className="bg-yellow-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Election</h2>
                  <p className="text-gray-600 mb-4">
                    There is currently no active election. Please check back later or contact the administrator.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <a
                      href="/admin-login"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin Login</span>
                    </a>
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
            {election && election.status === 'active' ? (
              <>
                {/* Registration Form */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Register to Vote</h2>
                      <p className="text-gray-600">Enter your details to get a voting code</p>
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

                  {/* Blockchain Status Warning */}
                  {blockchainStatus === 'disconnected' && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-red-900 mb-1">Blockchain Connection Required</h4>
                          <p className="text-sm text-red-700">
                            Voting is currently unavailable because the blockchain network is not connected. 
                            Please ensure the blockchain network is running before attempting to vote.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Election Status Check */}
                  {election && election.status !== 'active' && election.status !== 'inactive' && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <span className="text-yellow-800">
                          {election.status === 'draft' ? 'Election is not yet active. Please wait for the administrator to start the election.' : 
                           election.status === 'completed' ? 'Election has ended.' : 'Election status is unknown.'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Your Details</h3>
                    <p className="text-gray-600">Please provide your matric number and surname</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="matricNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Matric Number
                      </label>
                      <input
                        type="text"
                        id="matricNumber"
                        value={matricNumber}
                        onChange={(e) => setMatricNumber(e.target.value)}
                        disabled={election && election.status !== 'active'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
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
                        disabled={election && election.status !== 'active'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your surname"
                        required
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateCode}
                    disabled={generating || !matricNumber.trim() || !surname.trim()}
                    className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {generating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Generating Code...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>Generate Code</span>
                      </div>
                    )}
                  </button>
                </div>

                {/* Generated Code Display */}
                {showCode && generatedCode && (
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="text-center">
                      <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Voting Code</h3>
                      <p className="text-gray-600 mb-4">Please save this code. You'll need it to vote.</p>
                      
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                          {generatedCode}
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={copyCodeToClipboard}
                          className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Copy Code
                        </button>
                        <button
                          onClick={handleProceedToVote}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Proceed to Vote
                        </button>
                      </div>
                    </div>
                  </div>
                )}


              </>
            ) : (
              /* No Election - Disabled Form */
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="text-center">
                  <div className="bg-gray-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-gray-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Voting Not Available</h2>
                  <p className="text-gray-600 mb-4">
                    Voting is currently not available. Please wait for an active election to begin.
                  </p>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      When an election is active, you'll be able to enter your voting code here.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Voting Procedures - Full Width */}
        {election && election.status === 'active' && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Voting Procedures</h3>
                  <p className="text-gray-600">Follow these steps to cast your vote</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Ensure Election is Active</h4>
                    <p className="text-sm text-gray-600">Make sure the election is online and blockchain is connected</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Enter Your Details</h4>
                    <p className="text-sm text-gray-600">Provide your surname and matric number for verification</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Copy Your Code</h4>
                    <p className="text-sm text-gray-600">Save your voting code securely for later use</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">4</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Cast Your Votes</h4>
                    <p className="text-sm text-gray-600">Select your preferred candidates for each position</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">5</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Submit with Code</h4>
                    <p className="text-sm text-gray-600">Enter your voting code and submit your votes to complete the process</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Security Note</h4>
                    <p className="text-sm text-blue-700">
                      Your voting code is unique and secure. Keep it safe as it can be used to verify your vote on the blockchain later.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LandingPage 