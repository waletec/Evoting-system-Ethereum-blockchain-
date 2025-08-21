import React from 'react';

"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Vote,
  Clock,
  Shield,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  User,
  AlertTriangle,
  Info,
  Loader2,
  Key,
} from "lucide-react"
import { castVote, getCurrentElectionInfo, getBlockchainStatus, verifyVotingCode } from "../api"
import BlockchainStatus from "../components/BlockchainStatus"

const VotingPage = () => {
  const [voterSession, setVoterSession] = useState(null)
  const [election, setElection] = useState(null)
  const [voteSelections, setVoteSelections] = useState([])
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [candidate, setCandidate] = useState("")
  const [blockchainStatus, setBlockchainStatus] = useState('checking')
  const [votingCode, setVotingCode] = useState("")
  const [codeValidationError, setCodeValidationError] = useState("")
  const [isValidatingCode, setIsValidatingCode] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    // Check for valid voter session
    const sessionData = localStorage.getItem("voterSession")
    console.log("🔍 Session data from localStorage:", sessionData)
    
    if (!sessionData) {
      console.log("❌ No session data found, redirecting to home")
      navigate("/")
      return
    }

    try {
      const session = JSON.parse(sessionData)
      console.log("✅ Parsed session:", session)
      setVoterSession(session)
      loadElectionData()
    } catch (error) {
      console.error("❌ Invalid session data:", error)
      navigate("/")
    }
  }, [navigate])

  useEffect(() => {
    if (election) {
      const timer = setInterval(() => {
        updateTimeRemaining()
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [election])

  const loadElectionData = async () => {
    try {
      setLoading(true)
      setError("")

      // Check blockchain status first
      try {
        const blockchainResponse = await getBlockchainStatus();
        setBlockchainStatus(blockchainResponse.status);
        console.log('🔗 Blockchain status:', blockchainResponse.status);
      } catch (blockchainError) {
        console.error('❌ Failed to check blockchain status:', blockchainError);
        setBlockchainStatus('disconnected');
      }

      // Fetch election data from the database with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const dataPromise = getCurrentElectionInfo();
      
      const response = await Promise.race([dataPromise, timeoutPromise]);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load election data')
      }

      // Transform the API response to match our expected format
      const electionData = response.election
      const candidatesData = response.candidates
      
      console.log('🔍 Candidates data received:', candidatesData)

      // Group candidates by position
      const positionsMap = {}
      candidatesData.forEach(candidate => {
        if (!positionsMap[candidate.position]) {
          positionsMap[candidate.position] = []
        }
        positionsMap[candidate.position].push({
          id: candidate.id,
          fullName: candidate.fullName,
          department: candidate.department,
          matricNumber: candidate.id, // Using ID as matric number for now
          imageUrl: candidate.image || "https://via.placeholder.com/150x150?text=No+Image",
          bio: `Candidate for ${candidate.position}`,
          manifesto: `I am running for ${candidate.position} position.`,
        })
      })

      // Convert to positions array
      const positions = Object.keys(positionsMap).map((position, index) => ({
        id: index + 1,
        title: position,
        description: `${position} - Lead and represent the student body`,
        maxVotesPerVoter: 1,
        candidates: positionsMap[position]
      }))

      const election = {
        id: 1,
        title: electionData.title || "Election in Progress",
        description: electionData.description || "Annual student union leadership election",
        endDate: electionData.endDate ? electionData.endDate : (electionData.startDate ? new Date(new Date(electionData.startDate).getTime() + 12 * 60 * 60 * 1000).toISOString() : "2024-12-31T21:00:00Z"),
        positions: positions
      }

      setElection(election)
      initializeVoteSelections(election)
    } catch (error) {
      console.error("Failed to load election data:", error)
      setError("Failed to load election information")
    } finally {
      setLoading(false)
    }
  }

  const initializeVoteSelections = (election) => {
    const selections = election.positions.map((position) => ({
      positionId: position.id,
      positionTitle: position.title,
      candidateIds: [],
      maxVotes: position.maxVotesPerVoter,
    }))
    setVoteSelections(selections)
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

  const handleCandidateSelection = (positionId, candidateId) => {
    setVoteSelections((prev) =>
      prev.map((selection) => {
        if (selection.positionId === positionId) {
          const isSelected = selection.candidateIds.includes(candidateId)
          let newCandidateIds

          if (isSelected) {
            // Remove candidate if already selected
            newCandidateIds = selection.candidateIds.filter((id) => id !== candidateId)
          } else {
            // Add candidate if not selected and under max limit
            if (selection.candidateIds.length < selection.maxVotes) {
              newCandidateIds = [...selection.candidateIds, candidateId]
            } else {
              newCandidateIds = selection.candidateIds
            }
          }

          return {
            ...selection,
            candidateIds: newCandidateIds,
          }
        }
        return selection
      }),
    )
  }

  const isSelected = (positionId, candidateId) => {
    const selection = voteSelections.find((s) => s.positionId === positionId)
    return selection ? selection.candidateIds.includes(candidateId) : false
  }

  const canProceedToNext = () => {
    const currentSelection = voteSelections[currentPositionIndex]
    return currentSelection && currentSelection.candidateIds.length > 0
  }

  const handleNext = () => {
    if (currentPositionIndex < election.positions.length - 1) {
      setCurrentPositionIndex(currentPositionIndex + 1)
    } else {
      setShowConfirmation(true)
    }
  }

  const handlePrevious = () => {
    if (currentPositionIndex > 0) {
      setCurrentPositionIndex(currentPositionIndex - 1)
    }
  }

  const handleSubmitVotes = async () => {
    if (!voterSession || !election) return

    // Validate voting code first
    if (!votingCode.trim()) {
      setCodeValidationError("Please enter your voting code")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")
      setCodeValidationError("")

      // Verify the voting code before proceeding
      setIsValidatingCode(true)
      const codeVerification = await verifyVotingCode(votingCode, voterSession.matricNumber)
      
      if (!codeVerification.success) {
        setCodeValidationError(codeVerification.message || "Invalid voting code")
        setIsValidatingCode(false)
        return
      }

      setIsValidatingCode(false)

      // Use matric number from session
      let actualMatricNumber = voterSession.matricNumber

      // Check if all positions have been voted for
      const unvotedPositions = voteSelections.filter(selection => selection.candidateIds.length === 0)
      if (unvotedPositions.length > 0) {
        setError(`Please vote for all positions: ${unvotedPositions.map(s => s.positionTitle).join(', ')}`)
        return
      }

      // Submit votes for all positions
      for (let i = 0; i < voteSelections.length; i++) {
        const selection = voteSelections[i]
        const selectedCandidateId = selection.candidateIds[0]
        const selectedCandidate = election.positions[i].candidates.find(
        (c) => c.id === selectedCandidateId
      )

      if (!selectedCandidate) {
          setError(`Invalid candidate selection for ${selection.positionTitle}`)
        return
      }

        const apiData = {
          matricNumber: actualMatricNumber,
          code: votingCode, // Use the entered voting code
          candidate: selectedCandidate.fullName,
          position: selection.positionTitle
        }

        // Validate all fields are present
        if (!apiData.matricNumber || !apiData.code || !apiData.candidate || !apiData.position) {
          setError(`Missing required fields for ${selection.positionTitle}`)
          return
        }

        // Use the backend API for each position
      await castVote(
          apiData.matricNumber,
          apiData.code,
          apiData.candidate,
          apiData.position
        )
      }

      // Clear session data
      localStorage.removeItem("voterSession")
      setHasVoted(true)
      setShowConfirmation(false)
    } catch (error) {
      console.error("Failed to submit votes:", error)
      setError(error.error || "Failed to submit votes. Please try again.")
    } finally {
      setIsSubmitting(false)
      setIsValidatingCode(false)
    }
  }

  const handleBackToLanding = () => {
    localStorage.removeItem("voterSession")
    navigate("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading voting interface...</p>
        </div>
      </div>
    )
  }

  if (hasVoted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center bg-white rounded-2xl shadow-xl p-8">
          <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">Vote Successfully Cast!</h2>
          <p className="text-gray-600 mb-6 text-lg">
            Your vote has been securely recorded and verified on the blockchain.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-green-600 mr-2" />
              <span className="font-semibold text-green-800">Blockchain Verification</span>
            </div>
            <p className="text-sm text-green-700">Your vote is anonymous and cannot be traced back to you.</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate("/result")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              <span>View Live Results</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={handleBackToLanding}
              className="w-full border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!election || !voterSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Session</h2>
          <p className="text-gray-600 mb-4">Please return to the home page and generate a new voting code.</p>
          <button
            onClick={handleBackToLanding}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const currentPosition = election.positions[currentPositionIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToLanding}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{election.title}</h1>
                <p className="text-sm text-gray-500">Voting Interface</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <BlockchainStatus showDetails={false} />
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{timeRemaining}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>Voter: {voterSession.matricNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Position {currentPositionIndex + 1} of {election.positions.length}</h2>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Secure Voting</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentPositionIndex + 1) / election.positions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Position Details */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentPosition.title}</h3>
            <p className="text-gray-600">{currentPosition.description}</p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Select up to {currentPosition.maxVotesPerVoter} candidate{currentPosition.maxVotesPerVoter > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Candidates */}
          <div className="grid gap-4">
            {currentPosition.candidates.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() => handleCandidateSelection(currentPosition.id, candidate.id)}
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  isSelected(currentPosition.id, candidate.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {candidate.imageUrl && candidate.imageUrl !== "https://via.placeholder.com/150x150?text=No+Image" ? (
                        <img 
                          src={candidate.imageUrl} 
                          alt={candidate.fullName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${candidate.imageUrl && candidate.imageUrl !== "https://via.placeholder.com/150x150?text=No+Image" ? 'hidden' : ''}`}>
                        <User className="h-8 w-8 text-gray-500" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{candidate.fullName}</h4>
                      {isSelected(currentPosition.id, candidate.id) && (
                        <CheckCircle className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{candidate.department}</p>
                    <p className="text-sm text-gray-600 mb-3">{candidate.bio}</p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Manifesto</h5>
                      <p className="text-sm text-gray-600">{candidate.manifesto}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blockchain Status Warning */}
        {blockchainStatus === 'disconnected' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
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

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentPositionIndex === 0}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {currentPositionIndex + 1} of {election.positions.length}
            </span>
            {currentPositionIndex === election.positions.length - 1 ? (
              <button
                onClick={() => setShowConfirmation(true)}
                disabled={!canProceedToNext() || blockchainStatus === 'disconnected'}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Vote className="h-5 w-5" />
                <span>Submit Vote</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
            <div className="text-center mb-6">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Vote className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your Vote</h2>
              <p className="text-gray-600">Please review your selections before submitting</p>
            </div>

            {/* Vote Summary */}
            <div className="space-y-4 mb-6">
              {voteSelections.map((selection) => {
                if (selection.candidateIds.length === 0) return null
                const position = election.positions.find((p) => p.id === selection.positionId)
                const candidates = position?.candidates.filter((c) => selection.candidateIds.includes(c.id)) || []
                return (
                  <div key={selection.positionId} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">{position?.title}</h4>
                    <div className="space-y-1">
                      {candidates.map((candidate) => (
                        <div key={candidate.id} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">{candidate.fullName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>



            {/* Blockchain Status in Confirmation */}
            {blockchainStatus === 'disconnected' && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">Blockchain connection required to submit vote</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* Voting Code Input */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Key className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Enter Your Voting Code</span>
                </div>
                <input
                  type="text"
                  value={votingCode}
                  onChange={(e) => {
                    setVotingCode(e.target.value)
                    setCodeValidationError("")
                  }}
                  placeholder="Enter the voting code you received"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    codeValidationError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {codeValidationError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{codeValidationError}</span>
                  </p>
                )}
                <p className="mt-2 text-xs text-blue-700">
                  This code was sent to you during registration and is required to submit your vote.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Review Again
                </button>
                <button
                  onClick={handleSubmitVotes}
                  disabled={isSubmitting || blockchainStatus === 'disconnected' || !votingCode.trim()}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Confirm & Submit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VotingPage 