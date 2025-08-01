import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => (
  <nav className="bg-gray-800 p-4">
    <div className="container mx-auto flex justify-between items-center">
      <div className="text-white font-bold text-xl">Voting System</div>
      <div className="space-x-4">
        <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
        <Link to="/register" className="text-gray-300 hover:text-white">Register</Link>
        <Link to="/vote" className="text-gray-300 hover:text-white">Vote</Link>
        <Link to="/view-vote" className="text-gray-300 hover:text-white">View Vote</Link>
        <Link to="/admin/login" className="text-gray-300 hover:text-white">Admin Login</Link>
      </div>
    </div>
  </nav>
);

export default Navbar; 