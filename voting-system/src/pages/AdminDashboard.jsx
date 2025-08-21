import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

import {
  Users,
  Vote,
  BarChart3,
  LogOut,
  Shield,
  Plus,
  Upload,
  Eye,
  Edit,
  Trash2,
  Play,
  Download,
  RotateCcw,
  AlertTriangle,
  FileText,
  UserPlus,
  CheckCircle,
  Save,
  Settings,
  Key,
  Loader2
} from 'lucide-react';
import { 
  getAllAdmins, 
  createAdmin, 
  resetAdminPassword, 
  deactivateAdmin,
  deleteAdmin,
  changeAdminPassword,
  updateAdmin,
  getAllCandidates,
  createCandidate,
  deleteCandidate,
  getAllVoters,
  createVoter,
  bulkCreateVoters,
  deleteVoter,
  getCurrentElection,
  createOrUpdateElection,
  startElection,
  resetSystem as resetSystemAPI,
  resetBlockchain,
  getElectionStats,
  getCurrentAdmin,
  adminLogout,
  refreshAdminSession,
  checkHealth,
  getBlockchainStatus,
  getResults
} from '../api';
import BlockchainStatus from '../components/BlockchainStatus';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUsername, setAdminUsername] = useState("Administrator");
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [electionTitle, setElectionTitle] = useState("");
  const [voters, setVoters] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [electionStarted, setElectionStarted] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState({
    totalVotesCast: 0,
    voterTurnout: 0,
    leadingCandidate: null,
    marginOfVictory: 0,
    participationRate: 0,
    lastUpdated: null
  });
  const [resultsRef] = useState(useRef(null));
  const [backendStatus, setBackendStatus] = useState('checking');
  const [blockchainStatus, setBlockchainStatus] = useState('checking');

  // Admin management states
  const [showAdminManagement, setShowAdminManagement] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  
  // Admin form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [showViewAdminModal, setShowViewAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  
  // Create admin form
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    role: 'admin'
  });
  
  // Password reset form
  const [passwordForm, setPasswordForm] = useState({
    adminId: '',
    newPassword: ''
  });
  
  // Change password form
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Modal states
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showVotersModal, setShowVotersModal] = useState(false);
  const [showUploadVotersModal, setShowUploadVotersModal] = useState(false);
  const [showViewVotersModal, setShowViewVotersModal] = useState(false);
  const [showCandidatesModal, setShowCandidatesModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showBlockchainResetModal, setShowBlockchainResetModal] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [showAddVoterModal, setShowAddVoterModal] = useState(false);

  // Form states
  const [tempElectionTitle, setTempElectionTitle] = useState("");
  const [newCandidate, setNewCandidate] = useState({});
  const [newVoter, setNewVoter] = useState({
    firstName: '',
    surname: '',
    matricNumber: '',
    department: '',
    faculty: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedVoters, setUploadedVoters] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          setIsLoading(false);
          navigate("/admin-login");
          return;
        }

        // Verify current session
        const response = await getCurrentAdmin();
        if (response.success) {
      setIsAuthenticated(true);
          setAdminUsername(response.admin.username || "Administrator");
          setCurrentAdmin(response.admin);
      loadExistingData();
    } else {
          // Session invalid, redirect to login
          localStorage.removeItem("adminToken");
          navigate("/admin-login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // Session expired or invalid, redirect to login
        localStorage.removeItem("adminToken");
        navigate("/admin-login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Load admins when admin management is shown
  useEffect(() => {
    if (showAdminManagement) {
      loadAdmins();
    }
  }, [showAdminManagement]);

  // Real-time results polling
  useEffect(() => {
    let interval;
    if (electionStarted) {
      // Fetch results immediately
      fetchRealTimeResults();
      // Then poll every 10 seconds for more frequent updates
      interval = setInterval(fetchRealTimeResults, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [electionStarted, candidates, voters]);

  // System status polling
  useEffect(() => {
    // Check system status immediately
    checkSystemStatus();
    
    // Then poll every 60 seconds
    const interval = setInterval(checkSystemStatus, 60000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Check backend health
      const healthResponse = await checkHealth();
      setBackendStatus('online');
      
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
      console.error('❌ Backend health check failed:', error);
      setBackendStatus('offline');
      setBlockchainStatus('disconnected');
    }
  };

  const refreshSystemStatus = async () => {
    setBackendStatus('checking');
    setBlockchainStatus('checking');
    await checkSystemStatus();
    showToast('System status refreshed', 'success');
  };

  const loadExistingData = async () => {
    try {
      // Check system status first
      await checkSystemStatus();

      // Load election data from database
      const electionResponse = await getCurrentElection();
      if (electionResponse.success && electionResponse.election) {
        setElectionTitle(electionResponse.election.title);
        setElectionStarted(electionResponse.election.status === 'active');
      }

      // Load voters from database
      const votersResponse = await getAllVoters();
      if (votersResponse.success) {
        setVoters(votersResponse.voters);
      }

      // Load candidates from database
      const candidatesResponse = await getAllCandidates();
      if (candidatesResponse.success) {
        setCandidates(candidatesResponse.candidates);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Error loading data from database', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem("adminToken");
      navigate("/admin-login");
    }
  };

  const handleSetElectionTitle = async () => {
    if (tempElectionTitle.trim()) {
      try {
        const response = await createOrUpdateElection({ title: tempElectionTitle });
        if (response.success) {
      setElectionTitle(tempElectionTitle);
      setShowTitleModal(false);
      setTempElectionTitle("");
      showToast("Election title set successfully!", "success");
        } else {
          showToast(response.message || "Failed to set election title", "error");
        }
      } catch (error) {
        console.error('Error setting election title:', error);
        showToast('Error setting election title', 'error');
      }
    }
  };

    const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      try {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (fileExtension === 'csv') {
          // Parse CSV file
          Papa.parse(file, {
            header: true, // Treat first row as headers
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors.length > 0) {
                showToast(`CSV parsing errors: ${results.errors.length} errors found`, "error");
                console.error('CSV parsing errors:', results.errors);
              }

              const parsedVoters = results.data
                .filter(row => row.firstName && row.surname && row.matricNumber) // Filter out empty rows
                .map(row => ({
                  firstName: row.firstName?.trim() || '',
                  surname: row.surname?.trim() || '',
                  matricNumber: row.matricNumber?.trim() || '',
                  department: row.department?.trim() || '',
                  faculty: row.faculty?.trim() || ''
                }));

              if (parsedVoters.length === 0) {
                showToast('No valid voter data found in the file. Please check the CSV format.', "error");
                return;
              }

              setUploadedVoters(parsedVoters);
              showToast(`File uploaded successfully! ${parsedVoters.length} voters ready to import.`, "success");
            },
            error: (error) => {
              console.error('CSV parsing error:', error);
              showToast('Error parsing CSV file. Please check the file format.', "error");
            }
          });
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          // Parse Excel file
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = new Uint8Array(e.target.result);
              const workbook = XLSX.read(data, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

              if (jsonData.length < 2) {
                showToast('Excel file must have at least a header row and one data row.', "error");
                return;
              }

              // Get headers from first row
              const headers = jsonData[0];
              const dataRows = jsonData.slice(1);

              const parsedVoters = dataRows
                .filter(row => row.length > 0 && row[0] && row[1] && row[2]) // Filter out empty rows
                .map(row => {
                  const voter = {};
                  headers.forEach((header, index) => {
                    if (header && row[index]) {
                      voter[header.toLowerCase()] = row[index]?.toString().trim() || '';
                    }
                  });
                  return voter;
                })
                .filter(voter => voter.firstname && voter.surname && voter.matricnumber) // Filter valid voters
                .map(voter => ({
                  firstName: voter.firstname || voter.firstName || '',
                  surname: voter.surname || voter.surname || '',
                  matricNumber: voter.matricnumber || voter.matricNumber || '',
                  department: voter.department || '',
                  faculty: voter.faculty || ''
                }));

              if (parsedVoters.length === 0) {
                showToast('No valid voter data found in the Excel file. Please check the format.', "error");
                return;
              }

              setUploadedVoters(parsedVoters);
              showToast(`File uploaded successfully! ${parsedVoters.length} voters ready to import.`, "success");
            } catch (error) {
              console.error('Excel parsing error:', error);
              showToast('Error parsing Excel file. Please check the file format.', "error");
            }
          };
          reader.readAsArrayBuffer(file);
        } else {
          showToast('Unsupported file format. Please upload a CSV or Excel file.', "error");
        }
      } catch (error) {
        console.error('Error uploading voters:', error);
        showToast('Error uploading voters', 'error');
      }
    }
  };

  const handleSubmitUploadedVoters = async () => {
    if (uploadedVoters.length === 0) {
      showToast('No voters to upload', 'error');
      return;
    }

    try {
      const response = await bulkCreateVoters(uploadedVoters);
      if (response.success) {
        setVoters(response.createdVoters);
        setUploadedVoters([]);
        setSelectedFile(null);
        setShowUploadVotersModal(false);
        showToast(`Successfully uploaded ${response.createdVoters.length} voters!`, "success");
        if (response.errors && response.errors.length > 0) {
          showToast(`Some voters had issues: ${response.errors.length} errors`, "error");
        }
      } else {
        showToast(response.message || "Failed to upload voters", "error");
      }
    } catch (error) {
      console.error('Error uploading voters:', error);
      showToast('Error uploading voters', 'error');
    }
  };

  const handleDeleteVoter = async (voterId) => {
    try {
      const response = await deleteVoter(voterId);
      if (response.success) {
        const updatedVoters = voters.filter((voter) => voter._id !== voterId);
    setVoters(updatedVoters);
    showToast("Voter deleted successfully!", "success");
      } else {
        showToast(response.message || "Failed to delete voter", "error");
      }
    } catch (error) {
      console.error('Error deleting voter:', error);
      showToast('Error deleting voter', 'error');
    }
  };

  const handleAddCandidate = async () => {
    if (newCandidate.fullName && newCandidate.email && newCandidate.matricNumber) {
      try {
        const candidateData = {
        fullName: newCandidate.fullName || "",
        email: newCandidate.email || "",
        phone: newCandidate.phone || "",
        department: newCandidate.department || "",
        matricNumber: newCandidate.matricNumber || "",
        position: newCandidate.position || "",
        image: newCandidate.image,
        agreedToRules: newCandidate.agreedToRules || false,
      };

        const response = await createCandidate(candidateData);
        if (response.success) {
          const updatedCandidates = [...candidates, response.candidate];
      setCandidates(updatedCandidates);
      setNewCandidate({});
      setShowAddCandidateModal(false);
      showToast("Candidate added successfully!", "success");
        } else {
          showToast(response.message || "Failed to add candidate", "error");
        }
      } catch (error) {
        console.error('Error adding candidate:', error);
        showToast('Error adding candidate', 'error');
      }
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    try {
      const response = await deleteCandidate(candidateId);
      if (response.success) {
        const updatedCandidates = candidates.filter((candidate) => candidate._id !== candidateId);
    setCandidates(updatedCandidates);
    showToast("Candidate deleted successfully!", "success");
      } else {
        showToast(response.message || "Failed to delete candidate", "error");
      }
    } catch (error) {
      console.error('Error deleting candidate:', error);
      showToast('Error deleting candidate', 'error');
    }
  };

  const handleStartElection = async () => {
    if (electionTitle && voters.length > 0 && candidates.length > 0) {
      try {
        const response = await startElection();
        if (response.success) {
      setElectionStarted(true);
          // Start real-time data fetching
          fetchRealTimeResults();
          showToast("Election started successfully!", "success");
        } else {
          showToast(response.message || "Failed to start election", "error");
        }
      } catch (error) {
        console.error('Error starting election:', error);
        showToast('Error starting election', 'error');
      }
    } else {
      showToast("Please set election title, upload voters, and add candidates first!", "error");
    }
  };

  const fetchRealTimeResults = async () => {
    if (!electionStarted) return;
    
    console.log('🔍 Debug: electionStarted:', electionStarted);
    console.log('🔍 Debug: candidates array:', candidates);
    console.log('🔍 Debug: voters array:', voters);
    
    // Don't fetch if no candidates or voters
    if (!candidates || candidates.length === 0) {
      console.log('⚠️ No candidates available for results');
      return;
    }
    
    if (!voters || voters.length === 0) {
      console.log('⚠️ No voters available for results');
      return;
    }
    
    setResultsLoading(true);
    
    try {
      // Fetch real-time results from backend
      const response = await getResults();
      console.log('📊 Real-time results response:', response);
      console.log('📊 Response success:', response.success);
      console.log('📊 Response results:', response.results);
      console.log('📊 Response totalVotes:', response.totalVotes);
      console.log('📊 Response voterTurnout:', response.voterTurnout);
      
      if (response && response.success && response.results) {
        console.log('✅ Processing valid results data');
        // Process real results from backend
        const allCandidates = [];
        
        // Flatten results from all positions into a single array
        response.results.forEach(positionResult => {
          console.log('📊 Processing position:', positionResult.positionTitle);
          positionResult.candidates.forEach(candidate => {
            console.log('📊 Processing candidate:', candidate.fullName, 'votes:', candidate.votes);
            allCandidates.push({
              candidateId: candidate.id,
        candidateName: candidate.fullName,
              position: positionResult.positionTitle,
            department: candidate.department,
              votes: candidate.votes || 0,
              percentage: parseFloat(candidate.percentage) || 0
        });
          });
        });

        console.log('📊 All candidates processed:', allCandidates);
        const sortedResults = allCandidates.sort((a, b) => b.votes - a.votes);
        setResults(sortedResults);

        // Calculate statistics using backend data
        const totalVotes = response.totalVotes || 0;
        const voterTurnout = response.voterTurnout || 0;
        
        setRealTimeStats({
          totalVotesCast: totalVotes,
          voterTurnout: voterTurnout,
          leadingCandidate: sortedResults.length > 0 ? sortedResults[0] : null,
          marginOfVictory: sortedResults.length > 1 ? sortedResults[0].votes - sortedResults[1].votes : 0,
          participationRate: voterTurnout,
          lastUpdated: new Date()
        });
        
        console.log('✅ Real-time results updated successfully with actual data');
    } else {
        console.log('⚠️ No valid results data, showing zero votes');
        console.log('⚠️ Response exists:', !!response);
        console.log('⚠️ Response success:', response?.success);
        console.log('⚠️ Response results exists:', !!response?.results);
        // Show actual candidates with zero votes instead of random data
        const zeroVoteResults = candidates.map((candidate) => ({
          candidateId: candidate._id,
          candidateName: candidate.fullName,
          position: candidate.position,
          department: candidate.department,
          votes: 0,
          percentage: 0
        }));

        setResults(zeroVoteResults);
        
        setRealTimeStats({
          totalVotesCast: 0,
          voterTurnout: 0,
          leadingCandidate: null,
          marginOfVictory: 0,
          participationRate: 0,
          lastUpdated: new Date()
        });
        
        console.log('✅ Showing zero votes for all candidates');
      }
    } catch (error) {
      console.error('❌ Error fetching real-time results:', error);
      // Show actual candidates with zero votes on error instead of random data
      const zeroVoteResults = candidates.map((candidate) => ({
        candidateId: candidate._id,
        candidateName: candidate.fullName,
        position: candidate.position,
        department: candidate.department,
        votes: 0,
        percentage: 0
      }));

      setResults(zeroVoteResults);
      
      setRealTimeStats({
        totalVotesCast: 0,
        voterTurnout: 0,
        leadingCandidate: null,
        marginOfVictory: 0,
        participationRate: 0,
        lastUpdated: new Date()
      });
      
      console.log('✅ Showing zero votes due to error');
    } finally {
      setResultsLoading(false);
    }
  };

  const calculateStatistics = (results, totalVotes) => {
    const voterTurnout = voters.length > 0 ? (totalVotes / voters.length) * 100 : 0;
    const leadingCandidate = results.length > 0 ? results[0] : null;
    const marginOfVictory = results.length > 1 ? results[0].votes - results[1].votes : 0;
    const participationRate = voters.length > 0 ? (totalVotes / voters.length) * 100 : 0;

    setRealTimeStats({
      totalVotesCast: totalVotes,
      voterTurnout: voterTurnout,
      leadingCandidate: leadingCandidate,
      marginOfVictory: marginOfVictory,
      participationRate: participationRate,
      lastUpdated: new Date()
    });
  };

  const handleExportResults = async () => {
    if (!resultsRef.current) {
      showToast("Results not available for export", "error");
      return;
    }

    try {
      const canvas = await html2canvas(resultsRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `election_results_${electionTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      pdf.save(fileName);

      showToast("Results exported to PDF successfully!", "success");
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      showToast("Error exporting to PDF", "error");
    }
  };

  const handleResetSystem = async () => {
    try {
      const response = await resetSystemAPI();
      if (response.success) {
        setElectionTitle("");
        setVoters([]);
        setCandidates([]);
        setResults([]);
        setElectionStarted(false);
        setShowResetModal(false);
        showToast("Database reset successfully!", "success");
      } else {
        showToast(response.message || "Failed to reset database", "error");
      }
    } catch (error) {
      console.error('Error resetting database:', error);
      showToast('Error resetting database', 'error');
    }
  };

  const handleResetBlockchain = async () => {
    try {
      const response = await resetBlockchain();
      if (response.success) {
        setShowBlockchainResetModal(false);
        setResults([]);
        showToast("Blockchain data reset successfully!", "success");
      } else {
        showToast(response.message || "Failed to reset blockchain", "error");
      }
    } catch (error) {
      console.error('Error resetting blockchain:', error);
      showToast('Error resetting blockchain', 'error');
    }
  };

  const showToast = (message, type = "info") => {
    // Simple toast implementation - you can replace with a proper toast library
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
      type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500"
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  // Admin management functions
  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await getAllAdmins();
      if (response.success) {
        setAdmins(response.admins);
      }
    } catch (error) {
      setAdminError('Failed to load admins');
      console.error('Load admins error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await createAdmin(createForm);
      if (response.success) {
        setAdminSuccess('Admin created successfully');
        setShowCreateForm(false);
        setCreateForm({ username: '', password: '', email: '', fullName: '', role: 'admin' });
        loadAdmins();
      }
    } catch (error) {
      console.error('Create admin error:', error);
      setAdminError(error.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await resetAdminPassword(passwordForm.adminId, passwordForm.newPassword);
      if (response.success) {
        setAdminSuccess('Password reset successfully');
        setShowPasswordForm(false);
        setPasswordForm({ adminId: '', newPassword: '' });
      }
    } catch (error) {
      setAdminError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      setAdminError('New passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      // Get current admin ID from localStorage or state
      const currentAdminData = localStorage.getItem('adminData');
      const currentAdmin = currentAdminData ? JSON.parse(currentAdminData) : null;
      
      if (!currentAdmin || !currentAdmin._id) {
        setAdminError('Unable to identify current admin');
        return;
      }
      
      const response = await changeAdminPassword(
        currentAdmin._id,
        changePasswordForm.currentPassword, 
        changePasswordForm.newPassword
      );
      if (response.success) {
        setAdminSuccess('Password changed successfully');
        setShowChangePasswordForm(false);
        setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      setAdminError(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to deactivate this admin?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await deactivateAdmin(adminId);
      if (response.success) {
        setAdminSuccess('Admin deactivated successfully');
        loadAdmins();
      }
    } catch (error) {
      setAdminError(error.message || 'Failed to deactivate admin');
    } finally {
      setLoading(false);
    }
  };

  const clearAdminMessages = () => {
    setAdminError('');
    setAdminSuccess('');
  };

  // Check if current admin is super admin
  const isSuperAdmin = () => {
    return currentAdmin && currentAdmin.role === 'super_admin';
  };

  // Enhanced admin management functions
  const handleViewAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowViewAdminModal(true);
  };

  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setCreateForm({
      username: admin.username,
      password: '',
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role
    });
    setShowEditAdminModal(true);
  };

  const handleDeleteAdmin = async (admin) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${admin.fullName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await deleteAdmin(admin._id);
      if (response.success) {
        setAdminSuccess(`Admin "${admin.fullName}" deleted successfully`);
        // Remove the admin from the local state immediately
        setAdmins(prevAdmins => {
          const filtered = prevAdmins.filter(a => a._id !== admin._id);
          return filtered;
        });
      }
    } catch (error) {
      console.error('Delete admin error:', error);
      setAdminError(error.message || 'Failed to delete admin');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    
    try {
      setLoading(true);
      const response = await updateAdmin(selectedAdmin._id, createForm);
      if (response.success) {
        setAdminSuccess('Admin updated successfully');
        setShowEditAdminModal(false);
        setSelectedAdmin(null);
        setCreateForm({ username: '', password: '', email: '', fullName: '', role: 'admin' });
        loadAdmins();
      }
    } catch (error) {
      setAdminError(error.message || 'Failed to update admin');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVoter = async () => {
    if (newVoter.firstName && newVoter.surname && newVoter.matricNumber) {
      try {
        const voterData = {
          firstName: newVoter.firstName,
          surname: newVoter.surname,
          matricNumber: newVoter.matricNumber,
          department: newVoter.department || "",
          faculty: newVoter.faculty || ""
        };

        const response = await createVoter(voterData);
        if (response.success) {
          const updatedVoters = [...voters, response.voter];
          setVoters(updatedVoters);
          setNewVoter({
            firstName: '',
            surname: '',
            matricNumber: '',
            department: '',
            faculty: ''
          });
          setShowAddVoterModal(false);
          showToast("Voter added successfully!", "success");
        } else {
          showToast(response.message || "Failed to add voter", "error");
        }
      } catch (error) {
        console.error('Error adding voter:', error);
        showToast('Error adding voter', 'error');
      }
    } else {
      showToast('Please fill in all required fields (First Name, Surname, Matric Number)', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // This will trigger the redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome, {adminUsername}!</h1>
                <p className="text-sm text-gray-600">
                  Admin Dashboard - Blockchain Voting System
                  {currentAdmin && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      currentAdmin.role === 'super_admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {currentAdmin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* System Status Indicators */}
              <div className="flex items-center space-x-3">
                {/* Backend Status */}
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${
                  backendStatus === 'online' 
                    ? 'text-green-600 bg-green-50 border-green-200' 
                    : backendStatus === 'offline'
                    ? 'text-red-600 bg-red-50 border-red-200'
                    : 'text-blue-600 bg-blue-50 border-blue-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    backendStatus === 'online' ? 'bg-green-600' : 
                    backendStatus === 'offline' ? 'bg-red-600' : 'bg-blue-600'
                  }`}></div>
                  <span>
                    {backendStatus === 'online' ? 'Backend Online' : 
                     backendStatus === 'offline' ? 'Backend Offline' : 'Checking...'}
                  </span>
                </div>
                
                {/* Blockchain Status */}
                <BlockchainStatus showDetails={false} />
              </div>

              {isSuperAdmin() && (
                <button
                  onClick={() => setShowAdminManagement(!showAdminManagement)}
                  className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                    showAdminManagement 
                      ? 'border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100' 
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Management
                  {showAdminManagement && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                      Active
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Status Warnings */}
        {(backendStatus === 'offline' || blockchainStatus === 'disconnected') && (
          <div className="mb-8 space-y-4">
            {backendStatus === 'offline' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-900 mb-1">Backend Server Offline</h4>
                    <p className="text-sm text-red-700">
                      The backend server is currently offline. Some admin functions may not work properly. 
                      Please ensure the backend server is running.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {blockchainStatus === 'disconnected' && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-orange-900 mb-1">Blockchain Network Disconnected</h4>
                    <p className="text-sm text-orange-700">
                      The blockchain network is currently disconnected. Voting operations will not be recorded on the blockchain. 
                      Please ensure the blockchain network is running for full functionality.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin Management Section */}
        {showAdminManagement && isSuperAdmin() && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>
              <button
                onClick={() => setShowAdminManagement(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {/* Admin Messages */}
            {adminError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">{adminError}</span>
                  <button onClick={clearAdminMessages} className="ml-auto text-red-600 hover:text-red-800">
                    ×
                  </button>
                </div>
              </div>
            )}
            
            {adminSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800">{adminSuccess}</span>
                  <button onClick={clearAdminMessages} className="ml-auto text-green-600 hover:text-green-800">
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Admin Action Buttons */}
            <div className="mb-6 flex flex-wrap gap-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add New Admin</span>
              </button>
              
              <button
                onClick={() => setShowPasswordForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Key className="h-4 w-4" />
                <span>Reset Password</span>
              </button>
              
              <button
                onClick={() => setShowChangePasswordForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Change My Password</span>
              </button>
            </div>

            {/* Admin List */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">All Administrators</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Total: {admins.length}</span>
                  <button
                    onClick={loadAdmins}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    title="Refresh list"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                  <p className="mt-2 text-gray-600">Loading administrators...</p>
                </div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No administrators found</p>
                  <p className="text-sm text-gray-400">Click "Add New Admin" to create the first administrator</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {admins.map((admin) => (
                    <div key={admin._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {admin.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{admin.fullName}</div>
                            <div className="text-sm text-gray-600">{admin.email}</div>
                            <div className="text-xs text-gray-500">@{admin.username}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              admin.role === 'super_admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {admin.isActive ? (
                                <span className="text-green-600">● Active</span>
                              ) : (
                                <span className="text-red-600">● Inactive</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {/* View Admin Details */}
                            <button
                              onClick={() => handleViewAdmin(admin)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {/* Edit Admin */}
                            <button
                              onClick={() => handleEditAdmin(admin)}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                              title="Edit admin"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            
                            {/* Delete/Deactivate Admin */}
                            {admin._id !== 'admin' && admin.isActive && (
                              <button
                                onClick={() => handleDeleteAdmin(admin)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                title="Delete admin"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Additional Info */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                          <div>
                            <span className="font-medium">Created:</span> {new Date(admin.createdAt).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Last Login:</span> {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tips Banner and Status Overview */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Voting Guidelines & Tips */}
          <div className="lg:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="p-6">
                <h3 className="text-xl font-semibold text-blue-900 mb-4">Voting Guidelines & Tips</h3>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Ensure all voters are registered before starting the election
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Upload candidate information with clear photos
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Set a clear election title for voter identification
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Monitor real-time results during the voting process
                  </li>
                </ul>
              </div>
                  </div>

          {/* Status Overview */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Election Status</p>
                  <p className="text-xl font-bold">{electionStarted ? "Active" : "Inactive"}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${electionStarted ? "bg-green-500" : "bg-red-500"}`}></div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Voters</p>
                  <p className="text-xl font-bold">{voters.length}</p>
                </div>
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Candidates</p>
                  <p className="text-xl font-bold">{candidates.length}</p>
                </div>
                <UserPlus className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Management Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* System Status Card */}
          <div className="bg-white border-2 rounded-lg">
            <div className="p-6 text-center">
              <div className="flex justify-between items-start mb-4">
                <div></div>
                <button
                  onClick={refreshSystemStatus}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Refresh system status"
                >
                  <Loader2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-center mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  backendStatus === 'online' && blockchainStatus === 'connected' 
                    ? 'bg-green-100' 
                    : backendStatus === 'offline' 
                    ? 'bg-red-100' 
                    : 'bg-orange-100'
                }`}>
                  {backendStatus === 'online' && blockchainStatus === 'connected' ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : backendStatus === 'offline' ? (
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                  )}
                </div>
              </div>
              <h3 className="font-semibold mb-2">System Status</h3>
              <div className="space-y-2">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  backendStatus === 'online' 
                    ? 'bg-green-100 text-green-800' 
                    : backendStatus === 'offline'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    backendStatus === 'online' ? 'bg-green-600' : 
                    backendStatus === 'offline' ? 'bg-red-600' : 'bg-blue-600'
                  }`}></div>
                  Backend: {backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Checking'}
                </div>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  blockchainStatus === 'connected' 
                    ? 'bg-green-100 text-green-800' 
                    : blockchainStatus === 'disconnected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    blockchainStatus === 'connected' ? 'bg-green-600' : 
                    blockchainStatus === 'disconnected' ? 'bg-red-600' : 'bg-blue-600'
                  }`}></div>
                  Blockchain: {blockchainStatus === 'connected' ? 'Connected' : blockchainStatus === 'disconnected' ? 'Disconnected' : 'Checking'}
                </div>
              </div>
            </div>
          </div>
          {/* Election Title Button */}
          <div
            onClick={() => !electionStarted && setShowTitleModal(true)}
            className={`cursor-pointer transition-shadow bg-white border-2 rounded-lg ${
              electionStarted 
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' 
                : 'hover:shadow-lg hover:border-blue-300'
            }`}
          >
            <div className="p-6 text-center">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Election Title</h3>
              <p className="text-sm text-gray-600">Set election name</p>
              {electionTitle && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                    {electionTitle}
                </span>
              )}
                {electionStarted && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Election Active
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* Upload Voters Button */}
          <div
            onClick={() => !electionStarted && setShowUploadVotersModal(true)}
            className={`cursor-pointer transition-shadow bg-white border-2 rounded-lg ${
              electionStarted 
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' 
                : 'hover:shadow-lg hover:border-green-300'
            }`}
          >
            <div className="p-6 text-center">
              <Upload className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Upload Voters</h3>
              <p className="text-sm text-gray-600">Import voter list</p>
              {voters.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                  {voters.length} voters
                </span>
              )}
                {electionStarted && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Locked
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* View Voters Button */}
          <div
            onClick={() => setShowViewVotersModal(true)}
            className="cursor-pointer hover:shadow-lg transition-shadow bg-white border-2 hover:border-purple-300 rounded-lg"
          >
            <div className="p-6 text-center">
              <Eye className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">View Voters</h3>
              <p className="text-sm text-gray-600">Manage voter list</p>
              {voters.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2">
                  {voters.length} registered
                </span>
              )}
            </div>
          </div>

          {/* Manage Candidates Button */}
          <div
            onClick={() => !electionStarted && setShowCandidatesModal(true)}
            className={`cursor-pointer transition-shadow bg-white border-2 rounded-lg ${
              electionStarted 
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' 
                : 'hover:shadow-lg hover:border-orange-300'
            }`}
          >
            <div className="p-6 text-center">
              <UserPlus className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Manage Candidates</h3>
              <p className="text-sm text-gray-600">Add/edit candidates</p>
              {candidates.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-2">
                  {candidates.length} candidates
                </span>
              )}
                {electionStarted && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Locked
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Election Control Center</h3>
            <p className="text-sm text-gray-500">Manage the election process and view results</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Start Election */}
              <button
                onClick={handleStartElection}
                disabled={!electionTitle || voters.length === 0 || candidates.length === 0 || electionStarted}
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                <Play className="h-8 w-8" />
                <span>{electionStarted ? "Election Active" : "Start Election"}</span>
              </button>

              {/* Real-time Results */}
              <button
                onClick={() => setShowResultsModal(true)}
                disabled={!electionStarted}
                className="h-20 flex flex-col items-center justify-center space-y-2 border-2 border-gray-300 hover:border-gray-400 disabled:border-gray-200 disabled:text-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
              >
                <BarChart3 className="h-8 w-8" />
                <span>Real-time Results</span>
              </button>

              {/* Export Results */}
              <button
                onClick={handleExportResults}
                disabled={!electionStarted}
                className="h-20 flex flex-col items-center justify-center space-y-2 border-2 border-gray-300 hover:border-gray-400 disabled:border-gray-200 disabled:text-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
              >
                <Download className="h-8 w-8" />
                <span>Export Results</span>
              </button>

              {/* Reset Election */}
              <button
                onClick={() => setShowResetModal(true)}
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="h-8 w-8" />
                <span>Reset Election</span>
              </button>

              {/* Reset Blockchain */}
              <button
                onClick={() => setShowBlockchainResetModal(true)}
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="h-8 w-8" />
                <span>Reset Blockchain</span>
              </button>
            </div>
          </div>
        </div>


      </main>

      {/* Modals */}
      {showBlockchainResetModal && (
        <Modal onClose={() => setShowBlockchainResetModal(false)}>
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-red-900">Reset Blockchain Data</h3>
              <p className="mt-2 text-sm text-gray-600">
                This will clear all votes from the blockchain. This action cannot be undone. 
                The election database will not be affected.
              </p>
            </div>
            <div className="mt-5 flex justify-end space-x-3">
              <button
                onClick={() => setShowBlockchainResetModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetBlockchain}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Reset Blockchain
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      {showTitleModal && (
        <Modal onClose={() => setShowTitleModal(false)}>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Set Election Title</h3>
            <p className="text-sm text-gray-500 mb-4">Enter a clear and descriptive title for this election.</p>
            <input
              id="election-title"
              name="electionTitle"
              type="text"
              value={tempElectionTitle}
              onChange={(e) => setTempElectionTitle(e.target.value)}
              placeholder="e.g., Student Union Election 2024"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {electionTitle && (
              <p className="text-sm text-gray-600 mt-2">
                Current title: <span className="font-semibold">{electionTitle}</span>
              </p>
            )}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTitleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSetElectionTitle}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Save Title
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Management Modals */}
      {showCreateForm && (
        <Modal onClose={() => setShowCreateForm(false)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Admin</h3>
            <form onSubmit={handleCreateAdmin} className="space-y-4" onClick={(e) => e.stopPropagation()}>
              <div>
                <label htmlFor="create-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  id="create-username"
                  name="username"
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="create-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  id="create-password"
                  name="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="create-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="create-email"
                  name="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="create-fullname" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  id="create-fullname"
                  name="fullName"
                  type="text"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({...createForm, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="create-role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  id="create-role"
                  name="role"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Create Admin'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {showPasswordForm && (
        <Modal onClose={() => setShowPasswordForm(false)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Reset Admin Password</h3>
            <form onSubmit={handleResetPassword} className="space-y-4" onClick={(e) => e.stopPropagation()}>
              <div>
                <label htmlFor="reset-admin-select" className="block text-sm font-medium text-gray-700 mb-1">Select Admin</label>
                <select
                  id="reset-admin-select"
                  name="adminId"
                  value={passwordForm.adminId}
                  onChange={(e) => setPasswordForm({...passwordForm, adminId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select an admin</option>
                  {admins.map((admin) => (
                    <option key={admin._id} value={admin._id}>
                      {admin.fullName} (@{admin.username})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="reset-new-password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  id="reset-new-password"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {showChangePasswordForm && (
        <Modal onClose={() => setShowChangePasswordForm(false)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Change My Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4" onClick={(e) => e.stopPropagation()}>
              <div>
                <label htmlFor="change-current-password" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  id="change-current-password"
                  name="currentPassword"
                  type="password"
                  value={changePasswordForm.currentPassword}
                  onChange={(e) => setChangePasswordForm({...changePasswordForm, currentPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="change-new-password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  id="change-new-password"
                  name="newPassword"
                  type="password"
                  value={changePasswordForm.newPassword}
                  onChange={(e) => setChangePasswordForm({...changePasswordForm, newPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="change-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  id="change-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={changePasswordForm.confirmPassword}
                  onChange={(e) => setChangePasswordForm({...changePasswordForm, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowChangePasswordForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* View Admin Modal */}
      {showViewAdminModal && selectedAdmin && (
        <Modal onClose={() => setShowViewAdminModal(false)}>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {selectedAdmin.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedAdmin.fullName}</h3>
                <p className="text-gray-600">{selectedAdmin.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">@{selectedAdmin.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedAdmin.role === 'super_admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedAdmin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedAdmin.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedAdmin.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {new Date(selectedAdmin.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {selectedAdmin.lastLogin ? new Date(selectedAdmin.lastLogin).toLocaleString() : 'Never logged in'}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowViewAdminModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewAdminModal(false);
                  handleEditAdmin(selectedAdmin);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Edit Admin
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Admin Modal */}
      {showEditAdminModal && selectedAdmin && (
        <Modal onClose={() => setShowEditAdminModal(false)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Administrator</h3>
            <form onSubmit={handleUpdateAdmin} className="space-y-4" onClick={(e) => e.stopPropagation()}>
              <div>
                <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  id="edit-username"
                  name="username"
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-fullname" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  id="edit-fullname"
                  name="fullName"
                  type="text"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({...createForm, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  id="edit-role"
                  name="role"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
                <input
                  id="edit-password"
                  name="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password or leave blank"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Update Admin'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditAdminModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Upload Voters Modal */}
      {showUploadVotersModal && (
        <Modal onClose={() => setShowUploadVotersModal(false)} size="large">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Upload Voters</h3>
              <button
                onClick={() => setShowUploadVotersModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {/* Upload Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3">Upload Voter File</h4>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <span className="text-sm text-gray-500">CSV or Excel format</span>
              </div>
              
              {selectedFile && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800">File selected: {selectedFile.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Uploaded Voters */}
            {uploadedVoters.length > 0 && (
              <div className="mb-6 bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-medium text-gray-900">Preview ({uploadedVoters.length} voters)</h4>
                    <span className="text-sm text-gray-500">Ready to import</span>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surname</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matric Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {uploadedVoters.map((voter, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{voter.firstName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{voter.surname}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{voter.matricNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{voter.department}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{voter.faculty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadVotersModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitUploadedVoters}
                disabled={uploadedVoters.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Import Voters
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Voters Modal */}
      {showViewVotersModal && (
        <Modal onClose={() => setShowViewVotersModal(false)} size="large">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">View Voters</h3>
              <div className="flex items-center space-x-4">
                <div className="flex flex-col">
                <button
                  onClick={() => setShowAddVoterModal(true)}
                    disabled={!currentAdmin || currentAdmin.role !== 'super_admin'}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      currentAdmin && currentAdmin.role === 'super_admin'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    }`}
                    title={currentAdmin && currentAdmin.role === 'super_admin' ? 'Add new voter' : 'Only Super Admins can add voters'}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Voter</span>
                </button>
                  {currentAdmin && currentAdmin.role !== 'super_admin' && (
                    <span className="text-xs text-gray-500 mt-1">Super Admin only</span>
                  )}
                </div>
                <button
                  onClick={() => setShowViewVotersModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Voters List */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h4 className="text-md font-medium text-gray-900">Registered Voters ({voters.length})</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Total: {voters.length}</span>
                  </div>
                </div>
              </div>
              
              {voters.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No voters registered yet</p>
                  <p className="text-sm text-gray-400">Add voters individually or upload a CSV file</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surname</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matric Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {voters.map((voter) => (
                        <tr key={voter._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{voter.firstName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{voter.surname}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{voter.matricNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{voter.department}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{voter.faculty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDeleteVoter(voter._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete voter"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewVotersModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Voter Modal */}
      {showAddVoterModal && (
        <Modal onClose={() => setShowAddVoterModal(false)}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Add New Voter</h3>
              <button
                onClick={() => setShowAddVoterModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddVoter(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVoter.firstName}
                    onChange={(e) => setNewVoter({...newVoter, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Surname *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVoter.surname}
                    onChange={(e) => setNewVoter({...newVoter, surname: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter surname"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Matric Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVoter.matricNumber}
                    onChange={(e) => setNewVoter({...newVoter, matricNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter matric number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newVoter.department}
                    onChange={(e) => setNewVoter({...newVoter, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter department"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Faculty
                  </label>
                  <input
                    type="text"
                    value={newVoter.faculty}
                    onChange={(e) => setNewVoter({...newVoter, faculty: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter faculty"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddVoterModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Add Voter
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Candidates Modal */}
      {showCandidatesModal && (
        <Modal onClose={() => setShowCandidatesModal(false)} size="large">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Manage Candidates</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAddCandidateModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Candidate</span>
                </button>
                <button
                  onClick={() => setShowCandidatesModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Candidates List */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h4 className="text-md font-medium text-gray-900">Registered Candidates ({candidates.length})</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Total: {candidates.length}</span>
                  </div>
                </div>
              </div>
              
              {candidates.length === 0 ? (
                <div className="p-8 text-center">
                  <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No candidates registered yet</p>
                  <p className="text-sm text-gray-400">Click "Add Candidate" to register candidates</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const positions = [
                      "PRESIDENT",
                      "VICE PRESIDENT", 
                      "FINANCIAL SECRETARY",
                      "GENERAL SECRETARY",
                      "DIRECTOR OF SOCIALS",
                      "DIRECTOR OF SPORTS",
                      "DIRECTOR OF SOFTWARE",
                      "TREASURER",
                      "DIRECTOR OF WELFARE",
                      "ASSISTANT GENERAL SECRETARY"
                    ];
                    
                    return positions.map((position) => {
                      const positionCandidates = candidates.filter(c => c.position === position);
                      if (positionCandidates.length === 0) return null;
                      
                      return (
                        <div key={position} className="border border-gray-200 rounded-lg">
                          <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                            <h4 className="text-sm font-semibold text-blue-900">{position} ({positionCandidates.length} candidate{positionCandidates.length > 1 ? 's' : ''})</h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {positionCandidates.map((candidate) => (
                                  <tr key={candidate._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {candidate.image ? (
                                        <img src={candidate.image} alt={candidate.fullName} className="h-10 w-10 rounded-full object-cover" />
                                      ) : (
                                        <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                                          <span className="text-gray-600 font-semibold text-sm">
                                            {candidate.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                          </span>
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{candidate.fullName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      <button
                                        onClick={() => handleDeleteCandidate(candidate._id)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowCandidatesModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Candidate Modal */}
      {showAddCandidateModal && (
        <Modal onClose={() => setShowAddCandidateModal(false)}>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Candidate</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddCandidate(); }} className="space-y-4">
              <div>
                <label htmlFor="candidate-fullname" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  id="candidate-fullname"
                  type="text"
                  value={newCandidate.fullName || ''}
                  onChange={(e) => setNewCandidate({...newCandidate, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="candidate-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="candidate-email"
                  type="email"
                  value={newCandidate.email || ''}
                  onChange={(e) => setNewCandidate({...newCandidate, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="candidate-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  id="candidate-phone"
                  type="tel"
                  value={newCandidate.phone || ''}
                  onChange={(e) => setNewCandidate({...newCandidate, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="candidate-matric" className="block text-sm font-medium text-gray-700 mb-1">Matric Number</label>
                <input
                  id="candidate-matric"
                  type="text"
                  value={newCandidate.matricNumber || ''}
                  onChange={(e) => setNewCandidate({...newCandidate, matricNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="candidate-position" className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <select
                  id="candidate-position"
                  value={newCandidate.position || ''}
                  onChange={(e) => setNewCandidate({...newCandidate, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a position</option>
                  <option value="PRESIDENT">PRESIDENT</option>
                  <option value="VICE PRESIDENT">VICE PRESIDENT</option>
                  <option value="FINANCIAL SECRETARY">FINANCIAL SECRETARY</option>
                  <option value="GENERAL SECRETARY">GENERAL SECRETARY</option>
                  <option value="DIRECTOR OF SOCIALS">DIRECTOR OF SOCIALS</option>
                  <option value="DIRECTOR OF SPORTS">DIRECTOR OF SPORTS</option>
                  <option value="DIRECTOR OF SOFTWARE">DIRECTOR OF SOFTWARE</option>
                  <option value="TREASURER">TREASURER</option>
                  <option value="DIRECTOR OF WELFARE">DIRECTOR OF WELFARE</option>
                  <option value="ASSISTANT GENERAL SECRETARY">ASSISTANT GENERAL SECRETARY</option>
                </select>
              </div>
              <div>
                <label htmlFor="candidate-department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  id="candidate-department"
                  type="text"
                  value={newCandidate.department || ''}
                  onChange={(e) => setNewCandidate({...newCandidate, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="candidate-image" className="block text-sm font-medium text-gray-700 mb-1">Profile Image URL</label>
                <input
                  id="candidate-image"
                  type="url"
                  value={newCandidate.image || ''}
                  onChange={(e) => setNewCandidate({...newCandidate, image: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex items-center">
                <input
                  id="candidate-agreed"
                  type="checkbox"
                  checked={newCandidate.agreedToRules || false}
                  onChange={(e) => setNewCandidate({...newCandidate, agreedToRules: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="candidate-agreed" className="ml-2 block text-sm text-gray-900">
                  Candidate agrees to election rules and regulations
                </label>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Add Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCandidateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Results Modal */}
      {showResultsModal && (
        <Modal onClose={() => setShowResultsModal(false)} size="large">
          <div className="p-6" ref={resultsRef}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Real-Time Election Results</h3>
                <p className="text-sm text-gray-600">
                  Last updated: {realTimeStats.lastUpdated ? realTimeStats.lastUpdated.toLocaleTimeString() : 'Never'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchRealTimeResults}
                  disabled={resultsLoading}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    resultsLoading 
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  title="Refresh results"
                >
                  <Loader2 className={`h-4 w-4 ${resultsLoading ? 'animate-spin' : ''}`} />
                  <span>{resultsLoading ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                <button
                  onClick={handleExportResults}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Election Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-4">{electionTitle}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{voters.length}</div>
                  <div className="text-sm text-gray-600">Total Voters</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{realTimeStats.totalVotesCast}</div>
                  <div className="text-sm text-gray-600">Votes Cast</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{realTimeStats.voterTurnout.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Voter Turnout</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{candidates.length}</div>
                  <div className="text-sm text-gray-600">Candidates</div>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Leading Candidate</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {realTimeStats.leadingCandidate ? realTimeStats.leadingCandidate.candidateName : 'N/A'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-bold">1st</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Margin of Victory</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {realTimeStats.marginOfVictory} votes
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">Δ</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Participation Rate</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {realTimeStats.participationRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            {results.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Bar Chart */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-gray-900 mb-4">Vote Distribution</h5>
                  <Bar
                    data={{
                      labels: results.map(r => r.candidateName),
                      datasets: [{
                        label: 'Votes',
                        data: results.map(r => r.votes),
                        backgroundColor: [
                          'rgba(255, 206, 86, 0.8)',
                          'rgba(201, 203, 207, 0.8)',
                          'rgba(255, 159, 64, 0.8)',
                          'rgba(54, 162, 235, 0.8)',
                          'rgba(255, 99, 132, 0.8)',
                        ],
                        borderColor: [
                          'rgba(255, 206, 86, 1)',
                          'rgba(201, 203, 207, 1)',
                          'rgba(255, 159, 64, 1)',
                          'rgba(54, 162, 235, 1)',
                          'rgba(255, 99, 132, 1)',
                        ],
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>

                {/* Doughnut Chart */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-gray-900 mb-4">Vote Percentage</h5>
                  <Doughnut
                    data={{
                      labels: results.map(r => r.candidateName),
                      datasets: [{
                        data: results.map(r => r.percentage),
                        backgroundColor: [
                          'rgba(255, 206, 86, 0.8)',
                          'rgba(201, 203, 207, 0.8)',
                          'rgba(255, 159, 64, 0.8)',
                          'rgba(54, 162, 235, 0.8)',
                          'rgba(255, 99, 132, 0.8)',
                        ],
                        borderColor: [
                          'rgba(255, 206, 86, 1)',
                          'rgba(201, 203, 207, 1)',
                          'rgba(255, 159, 64, 1)',
                          'rgba(54, 162, 235, 1)',
                          'rgba(255, 99, 132, 1)',
                        ],
                        borderWidth: 2
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Detailed Results Table */}
            {results.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No results available yet</p>
                <p className="text-sm text-gray-400">Start the election to see results</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h5 className="text-lg font-semibold text-gray-900">Detailed Results</h5>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.map((result, index) => (
                        <tr key={result.candidateId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {result.candidateName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.position || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.department || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {result.votes}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                            {result.percentage.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${result.percentage}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowResultsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset System Modal */}
      {showResetModal && (
        <Modal onClose={() => setShowResetModal(false)}>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Reset System</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-4">
                Are you sure you want to reset the entire voting system? This will:
              </p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  Clear all election data (title, voters, candidates)
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  Stop the current election if active
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  Delete all voting results
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  Reset the system to initial state
                </li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleResetSystem}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
              >
                Yes, Reset System
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Modal Component
const Modal = ({ children, onClose, size = "default" }) => {
  const sizeClasses = {
    default: "max-w-md",
    large: "max-w-4xl",
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={handleBackdropClick}
      ></div>
      
      {/* Modal Content */}
      <div 
        className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default AdminDashboard; 