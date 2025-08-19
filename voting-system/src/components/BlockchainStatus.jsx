import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { getBlockchainStatus } from '../api';

const BlockchainStatus = ({ showDetails = false, className = "" }) => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkStatus = async () => {
    try {
      setStatus('checking');
      const data = await getBlockchainStatus();
      setStatus(data.status);
      setError(data.error);
      setLastChecked(new Date());
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Failed to check blockchain status');
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Blockchain Connected';
      case 'disconnected':
        return 'Blockchain Disconnected';
      case 'checking':
        return 'Checking Blockchain...';
      case 'error':
        return 'Blockchain Error';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'disconnected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'checking':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'error':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor()}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
      
      {showDetails && status === 'disconnected' && (
        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
          <p>⚠️ Voting requires blockchain connection</p>
          {error && <p className="mt-1">Error: {error}</p>}
        </div>
      )}
      
      {showDetails && lastChecked && (
        <div className="text-xs text-gray-500">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default BlockchainStatus; 