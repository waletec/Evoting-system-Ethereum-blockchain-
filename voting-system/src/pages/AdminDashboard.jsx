import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  bulkCreateVoters,
  deleteVoter,
  getCurrentElection,
  createOrUpdateElection,
  startElection,
  resetSystem as resetSystemAPI,
  getElectionStats
} from '../api';

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
  const [showCandidatesModal, setShowCandidatesModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);

  // Form states
  const [tempElectionTitle, setTempElectionTitle] = useState("");
  const [newCandidate, setNewCandidate] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const auth = localStorage.getItem("adminAuth");
    const adminData = localStorage.getItem("adminData");
    
    if (auth === "true" && adminData) {
      try {
        const admin = JSON.parse(adminData);
        setIsAuthenticated(true);
        setAdminUsername(admin.username || "Administrator");
        setCurrentAdmin(admin);
        loadExistingData();
      } catch (error) {
        console.error('AdminDashboard: Error parsing admin data:', error)
        navigate("/admin/login");
      }
    } else {
      navigate("/admin/login");
    }
    setIsLoading(false);
  }, []);

  // Load admins when admin management is shown
  useEffect(() => {
    if (showAdminManagement) {
      loadAdmins();
    }
  }, [showAdminManagement]);

  const loadExistingData = async () => {
    try {
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

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("adminUsername");
    localStorage.removeItem("adminData");
    navigate("/admin/login");
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
        // For now, we'll use mock data - in a real implementation, you'd parse the CSV file
        const mockVoters = [
          {
            fullName: "John Doe",
            email: "john@student.edu",
            matricNumber: "STU001",
            department: "Computer Science",
            faculty: "Engineering",
          },
          {
            fullName: "Jane Smith",
            email: "jane@student.edu",
            matricNumber: "STU002",
            department: "Mathematics",
            faculty: "Sciences",
          },
          {
            fullName: "Mike Johnson",
            email: "mike@student.edu",
            matricNumber: "STU003",
            department: "Physics",
            faculty: "Sciences",
          },
        ];

        const response = await bulkCreateVoters(mockVoters);
        if (response.success) {
          setVoters(response.createdVoters);
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
          
          // Simulate real-time results
          const mockResults = candidates.map((candidate, index) => ({
            candidateId: candidate._id,
            candidateName: candidate.fullName,
            votes: Math.floor(Math.random() * 100) + 10,
            percentage: 0,
          }));

          const totalVotes = mockResults.reduce((sum, result) => sum + result.votes, 0);
          mockResults.forEach((result) => {
            result.percentage = (result.votes / totalVotes) * 100;
          });

          setResults(mockResults.sort((a, b) => b.votes - a.votes));
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

  const handleExportResults = () => {
    const exportData = {
      electionTitle,
      totalVoters: voters.length,
      totalCandidates: candidates.length,
      results,
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `election_results_${Date.now()}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    showToast("Results exported successfully!", "success");
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
        showToast("System reset successfully!", "success");
      } else {
        showToast(response.message || "Failed to reset system", "error");
      }
    } catch (error) {
      console.error('Error resetting system:', error);
      showToast('Error resetting system', 'error');
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
                  Admin Dashboard - E-Voting System
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

        {/* Tips Banner */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <div>
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
              <div className="flex justify-center">
                <div className="relative">
                  <img
                    src="https://via.placeholder.com/250x200/3B82F6/FFFFFF?text=Voting+Illustration"
                    alt="Person voting at ballot box"
                    className="rounded-lg shadow-md"
                  />
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-2">
                    <Vote className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Management Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Election Title Button */}
          <div
            onClick={() => setShowTitleModal(true)}
            className="cursor-pointer hover:shadow-lg transition-shadow bg-white border-2 hover:border-blue-300 rounded-lg"
          >
            <div className="p-6 text-center">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Election Title</h3>
              <p className="text-sm text-gray-600">Set election name</p>
              {electionTitle && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                  Set
                </span>
              )}
            </div>
          </div>

          {/* Upload Voters Button */}
          <div
            onClick={() => setShowVotersModal(true)}
            className="cursor-pointer hover:shadow-lg transition-shadow bg-white border-2 hover:border-green-300 rounded-lg"
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
            </div>
          </div>

          {/* View Voters Button */}
          <div
            onClick={() => setShowVotersModal(true)}
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
            onClick={() => setShowCandidatesModal(true)}
            className="cursor-pointer hover:shadow-lg transition-shadow bg-white border-2 hover:border-orange-300 rounded-lg"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

              {/* Reset System */}
              <button
                onClick={() => setShowResetModal(true)}
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="h-8 w-8" />
                <span>Reset System</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Election Status</p>
                <p className="text-2xl font-bold">{electionStarted ? "Active" : "Inactive"}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${electionStarted ? "bg-green-500" : "bg-red-500"}`}></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Voters</p>
                <p className="text-2xl font-bold">{voters.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Candidates</p>
                <p className="text-2xl font-bold">{candidates.length}</p>
              </div>
              <UserPlus className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
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

      {/* Voters Modal */}
      {showVotersModal && (
        <Modal onClose={() => setShowVotersModal(false)} size="large">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Manage Voters</h3>
              <button
                onClick={() => setShowVotersModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {/* Upload Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3">Upload Voters</h4>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <span className="text-sm text-gray-500">CSV or Excel format</span>
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
                  <p className="text-sm text-gray-400">Upload a CSV file to add voters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matric Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {voters.map((voter) => (
                        <tr key={voter._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{voter.fullName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{voter.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{voter.matricNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{voter.department}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{voter.faculty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleDeleteVoter(voter._id)}
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
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowVotersModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
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
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {candidates.map((candidate) => (
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.position}</td>
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
                <input
                  id="candidate-position"
                  type="text"
                  value={newCandidate.position || ''}
                  onChange={(e) => setNewCandidate({...newCandidate, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
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
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Election Results</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleExportResults}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Results</span>
                </button>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{electionTitle}</h4>
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>Total Voters: <span className="font-semibold">{voters.length}</span></div>
                  <div>Total Candidates: <span className="font-semibold">{candidates.length}</span></div>
                  <div>Total Votes Cast: <span className="font-semibold">{results.reduce((sum, result) => sum + result.votes, 0)}</span></div>
                </div>
              </div>

              {results.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No results available yet</p>
                  <p className="text-sm text-gray-400">Start the election to see results</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={result.candidateId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">{result.candidateName}</h5>
                            <p className="text-sm text-gray-600">
                              {candidates.find(c => c._id === result.candidateId)?.position || 'Candidate'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{result.votes}</div>
                          <div className="text-sm text-gray-600">votes</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${result.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-right mt-1">
                        <span className="text-sm font-semibold text-gray-700">{result.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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