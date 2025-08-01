import axios from "axios";

const API_BASE = "http://localhost:4000/api"; // Change if your backend runs elsewhere

export const registerVoter = async (matricNumber, surname) => {
  return axios.post(`${API_BASE}/register`, { matricNumber, surname });
};

export const castVote = async (matricNumber, code, candidate) => {
  return axios.post(`${API_BASE}/vote`, { matricNumber, code, candidate });
};

export const getResults = async () => {
  return axios.get(`${API_BASE}/results`);
};

export const viewVote = async (matricNumber) => {
  return axios.post(`${API_BASE}/view-vote`, { matricNumber });
};