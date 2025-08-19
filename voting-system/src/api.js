import axios from 'axios';

// Base URL for your backend API
// Uses Vite env in browser: import.meta.env.VITE_API_BASE_URL (e.g., https://api.example.com/api)
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:4000/api';

// Simple cache for API responses
const cache = new Map();
const CACHE_DURATION = 30 * 1000; // 30 seconds

// Cache helper functions
const getCacheKey = (url, params = {}) => {
  return `${url}?${JSON.stringify(params)}`;
};

const getCachedResponse = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedResponse = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('adminToken');
      window.location.href = '/admin-login';
    }
    return Promise.reject(error);
  }
);

// API functions for voter operations
export const registerVoter = async (matricNumber, surname) => {
  try {
    const response = await api.post('/register', { matricNumber, surname });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const castVote = async (matricNumber, code, candidate, position) => {
  try {
    const response = await api.post('/vote', { matricNumber, code, candidate, position });
    
    // Clear cache after vote is cast to ensure fresh data
    cache.clear();
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getResults = async () => {
  try {
    const cacheKey = getCacheKey('/results');
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await api.get('/results');
    setCachedResponse(cacheKey, response.data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getCurrentElectionInfo = async () => {
  try {
    const cacheKey = getCacheKey('/election-info');
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await api.get('/election-info');
    setCachedResponse(cacheKey, response.data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const viewVote = async (code) => {
  try {
    const response = await api.post('/view-vote', { code });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const verifyVotingCode = async (code, matricNumber) => {
  try {
    const response = await api.post('/verify-code', { code, matricNumber });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMatricByCode = async (code) => {
  try {
    const response = await api.post('/get-matric-by-code', { code });
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

// Blockchain status endpoint
export const getBlockchainStatus = async () => {
  try {
    const response = await axios.get('http://localhost:4000/api/blockchain-status');
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
    // Store token in localStorage
    if (response.data.success && response.data.token) {
      localStorage.setItem('adminToken', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const adminLogout = async () => {
  try {
    const response = await api.post('/admin/logout');
    // Clear token from localStorage
    localStorage.removeItem('adminToken');
    return response.data;
  } catch (error) {
    // Clear token even if logout fails
    localStorage.removeItem('adminToken');
    throw error.response?.data || error;
  }
};

export const getCurrentAdmin = async () => {
  try {
    const response = await api.get('/admin/current');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const refreshAdminSession = async () => {
  try {
    const response = await api.post('/admin/refresh-session');
    // Update token in localStorage
    if (response.data.success && response.data.token) {
      localStorage.setItem('adminToken', response.data.token);
    }
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