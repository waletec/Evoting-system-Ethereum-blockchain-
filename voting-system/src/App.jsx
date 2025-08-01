import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RealTimeResult from './pages/RealTimeResult';
import VotingPage from './pages/VotingPage';
import ViewVotePage from './pages/ViewVotePage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<Navigate to="/" replace />} /> */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/result" element={<RealTimeResult />} />
        <Route path="/vote" element={<VotingPage />} />
        <Route path="/view-vote" element={<ViewVotePage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
