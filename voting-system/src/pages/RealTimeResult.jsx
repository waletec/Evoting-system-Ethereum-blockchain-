import React from 'react';

"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Trophy, Users, Vote, Clock, Shield, ArrowLeft, RefreshCw, TrendingUp, Award, Loader2 } from "lucide-react"
import { getResults, getCurrentElectionInfo } from "../api"

const RealTimeResults = () => {
  const [election, setElection] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [totalVotes, setTotalVotes] = useState(0)
  const [voterTurnout, setVoterTurnout] = useState(0)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]

  useEffect(() => {
    loadResults()

    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadResults()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadResults = async () => {
    try {
      setLoading(true)
      setError("")

      // Use the backend API
      const data = await getResults()
      
      // Transform the data to match our component structure
      const transformedResults = transformResultsData(data)
      
      setResults(transformedResults)
      setTotalVotes(data.totalVotes || 0)
      setVoterTurnout(data.voterTurnout || 0)
      setLastUpdated(new Date(data.lastUpdated) || new Date())

      // Get actual election data from API
      const electionInfoResponse = await getCurrentElectionInfo();
      if (electionInfoResponse.success && electionInfoResponse.election) {
        setElection({
          id: 1,
          title: electionInfoResponse.election.title,
          description: electionInfoResponse.election.description || "Election in progress",
          status: "active",
          totalRegisteredVoters: electionInfoResponse.election.totalVoters,
          endDate: new Date().toISOString(),
        });
      } else {
        // Fallback to mock data if API fails
      const mockElection = {
        id: 1,
          title: "Election in Progress",
          description: "Election is currently active",
        status: "active",
          totalRegisteredVoters: 0,
          endDate: new Date().toISOString(),
        };
        setElection(mockElection);
      }
    } catch (error) {
      console.error("Failed to load results:", error)
      setError("Failed to load election results. Please try again.")

      // Set empty results instead of mock data
      setResults([])
      setTotalVotes(0)
      setVoterTurnout(0)
    } finally {
      setLoading(false)
    }
  }

  const transformResultsData = (data) => {
    // Handle the new backend response format
    if (data.success && data.results && Array.isArray(data.results)) {
      // Backend already provides structured results
      return data.results.map((position, index) => ({
        positionId: index + 1,
        positionTitle: position.positionTitle,
        candidates: position.candidates.map((candidate, candidateIndex) => ({
          id: candidate.id || candidateIndex + 1,
          fullName: candidate.fullName,
          department: candidate.department || "Student",
          votes: candidate.votes || 0,
          percentage: candidate.percentage || 0,
        }))
      }))
    }

    // Fallback for old format or error cases
    if (!data.votes || !Array.isArray(data.votes)) {
      return []
    }

    // Group votes by candidate
    const candidateVotes = {}
    data.votes.forEach(vote => {
      if (!candidateVotes[vote.candidate]) {
        candidateVotes[vote.candidate] = 0
      }
      candidateVotes[vote.candidate]++
    })

    // Calculate total votes
    const totalVotes = Object.values(candidateVotes).reduce((sum, votes) => sum + votes, 0)

    // Transform to our format
    const candidates = Object.entries(candidateVotes).map(([candidate, votes], index) => ({
      id: index + 1,
      fullName: candidate,
      department: "Student", // Default department
      votes: votes,
      percentage: totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0,
    }))

    return [{
      positionId: 1,
      positionTitle: "President",
      candidates: candidates,
    }]
  }

  const formatTime = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date)
  }

  const getLeadingCandidate = (position) => {
    if (!position.candidates || position.candidates.length === 0) return null
    return position.candidates.reduce((leading, candidate) =>
      candidate.votes > leading.votes ? candidate : leading
    )
  }

  const getChartData = (position) => {
    const colors = [
      'rgba(255, 206, 86, 0.8)',   // Yellow
      'rgba(201, 203, 207, 0.8)',  // Gray
      'rgba(255, 159, 64, 0.8)',   // Orange
      'rgba(54, 162, 235, 0.8)',   // Blue
      'rgba(255, 99, 132, 0.8)',   // Red
      'rgba(75, 192, 192, 0.8)',   // Teal
      'rgba(153, 102, 255, 0.8)',  // Purple
      'rgba(255, 205, 86, 0.8)',   // Light Yellow
    ];
    
    return position.candidates.map((candidate, index) => ({
      name: candidate.fullName,
      votes: candidate.votes,
      percentage: candidate.percentage,
      fill: colors[index % colors.length],
      stroke: colors[index % colors.length].replace('0.8', '1'),
    }))
  }

  if (loading && results.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading election results...</p>
        </div>
      </div>
    )
  }

  // Show message when no results are available yet
  if (!loading && results.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Home</span>
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Live Election Results</h1>
                  <p className="text-sm text-gray-500">Real-time voting statistics</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="bg-yellow-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Results Yet</h2>
            <p className="text-gray-600 mb-4">
              No votes have been cast yet. Results will appear here once voting begins.
            </p>
            <button
              onClick={loadResults}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Results
            </button>
          </div>
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Live Election Results</h1>
                <p className="text-sm text-gray-500">Real-time voting statistics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Last updated: {formatTime(lastUpdated)}</span>
              </div>
              <button
                onClick={loadResults}
                disabled={loading}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
              </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Election Overview */}
        {election && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{election.title}</h2>
                <p className="text-gray-600">{election.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Live</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Total Voters</span>
          </div>
                <span className="text-2xl font-bold text-blue-900">{election.totalRegisteredVoters}</span>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Vote className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Votes Cast</span>
                </div>
                <span className="text-2xl font-bold text-green-900">{totalVotes}</span>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Turnout</span>
            </div>
                <span className="text-2xl font-bold text-purple-900">{voterTurnout}%</span>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Clock className="h-6 w-6 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Time Left</span>
                </div>
                <span className="text-lg font-bold text-orange-900">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-8">
          {results.map((position) => (
            <div key={position.positionId} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">{position.positionTitle}</h3>
                {getLeadingCandidate(position) && (
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-600">
                      Leading: {getLeadingCandidate(position).fullName}
                    </span>
                  </div>
                )}
                </div>

              <div className="grid lg:grid-cols-2 gap-8">
                  {/* Bar Chart */}
                  <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Vote Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getChartData(position)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                      <Tooltip />
                      <Bar dataKey="votes" fill={(entry) => entry.fill} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pie Chart */}
                  <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Percentage Breakdown</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                        data={getChartData(position)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="votes"
                        >
                        {getChartData(position).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.stroke} strokeWidth={2} />
                          ))}
                        </Pie>
                      <Tooltip />
                      <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              {/* Candidate Details */}
                <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Candidate Details</h4>
                <div className="grid gap-4">
                  {position.candidates.map((candidate, index) => (
                    <div
                      key={candidate.id}
                      className={`p-4 rounded-lg border-2 ${
                        index === 0 ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                            <span className="text-lg font-semibold text-gray-900">
                              {index + 1}.
                                  </span>
                                </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">{candidate.fullName}</h5>
                            <p className="text-sm text-gray-600">{candidate.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{candidate.votes}</div>
                          <div className="text-sm text-gray-600">{candidate.percentage}%</div>
                  </div>
                </div>
              </div>
                  ))}
              </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {results.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <Vote className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Available</h3>
            <p className="text-gray-600">Voting results will appear here once votes start coming in.</p>
          </div>
        )}
        </div>
    </div>
  )
}

export default RealTimeResults;