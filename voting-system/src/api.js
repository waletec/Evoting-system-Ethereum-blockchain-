import axios from 'axios';

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:4000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions for voter operations
export const registerVoter = async (matricNumber, surname) => {
  try {
    const response = await api.post('/register', { matricNumber, surname });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const castVote = async (matricNumber, code, candidate) => {
  try {
    const response = await api.post('/vote', { matricNumber, code, candidate });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getResults = async () => {
  try {
    const response = await api.get('/results');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getCurrentElectionInfo = async () => {
  try {
    const response = await api.get('/election-info');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const viewVote = async (matricNumber) => {
  try {
    const response = await api.post('/view-vote', { matricNumber });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Health check endpoint
export const checkHealth = async () => {
  try {
    const response = await axios.get('http://localhost:4000/health');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Candidate API functions
export const getAllCandidates = async () => {
  try {
    const response = await api.get('/candidates/all');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createCandidate = async (candidateData) => {
  try {
    const response = await api.post('/candidates/create', candidateData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateCandidate = async (candidateId, candidateData) => {
  try {
    const response = await api.put(`/candidates/update/${candidateId}`, candidateData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteCandidate = async (candidateId) => {
  try {
    const response = await api.delete(`/candidates/delete/${candidateId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Voter API functions
export const getAllVoters = async () => {
  try {
    const response = await api.get('/voters/all');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createVoter = async (voterData) => {
  try {
    const response = await api.post('/voters/create', voterData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const bulkCreateVoters = async (votersData) => {
  try {
    const response = await api.post('/voters/bulk-create', { voters: votersData });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteVoter = async (voterId) => {
  try {
    const response = await api.delete(`/voters/delete/${voterId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Election API functions
export const getCurrentElection = async () => {
  try {
    const response = await api.get('/election/current');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createOrUpdateElection = async (electionData) => {
  try {
    const response = await api.post('/election/create-or-update', electionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const startElection = async () => {
  try {
    const response = await api.post('/election/start');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const endElection = async () => {
  try {
    const response = await api.post('/election/end');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const resetSystem = async () => {
  try {
    const response = await api.post('/election/reset');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getElectionStats = async () => {
  try {
    const response = await api.get('/election/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Admin API functions
export const adminLogin = async (username, password) => {
  try {
    const response = await api.post('/admin/login', { username, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createAdmin = async (adminData) => {
  try {
    const response = await api.post('/admin/create', adminData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAllAdmins = async () => {
  try {
    const response = await api.get('/admin/all');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const resetAdminPassword = async (adminId, newPassword) => {
  try {
    const response = await api.put('/admin/reset-password', { adminId, newPassword });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const changeAdminPassword = async (adminId, currentPassword, newPassword) => {
  try {
    const response = await api.put('/admin/change-password', { adminId, currentPassword, newPassword });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deactivateAdmin = async (adminId) => {
  try {
    const response = await api.put(`/admin/deactivate/${adminId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteAdmin = async (adminId) => {
  try {
    const response = await api.delete(`/admin/delete/${adminId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateAdmin = async (adminId, adminData) => {
  try {
    const response = await api.put(`/admin/update/${adminId}`, adminData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const initializeSuperAdmin = async () => {
  try {
    const response = await api.post('/admin/initialize-super-admin');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default api;