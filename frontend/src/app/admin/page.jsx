'use client';

import { useState, useEffect } from 'react';
import { connectWallet, switchToIntuitionTestnet, getCurrentAccount, getEthereumProvider } from '../../utils/ethereum';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Market creation form
  const [question, setQuestion] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Market resolution
  const [marketId, setMarketId] = useState('');
  const [outcome, setOutcome] = useState('');

  // Contract addresses
  const PREDICTION_MARKET_ADDRESS = '0x90afF0acfF0Cb40EaB7Fc3bc1f4C054399d95D23';
  const WTRUST_ADDRESS = '0x06cB08C9A108B590F292Ff711EF2B702EC07747C';

  useEffect(() => {
    // Check if already authenticated
    const authStatus = localStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    
    // Check wallet connection
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const currentAccount = await getCurrentAccount();
      if (currentAccount) {
        setAccount(currentAccount);
      }
    } catch (err) {
      console.error('Error checking wallet:', err);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'trustbet_admin_2025') {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
    setAccount(null);
  };

  const connectMetaMask = async () => {
    try {
      setLoading(true);
      setError('');
      
      const accounts = await connectWallet();
      await switchToIntuitionTestnet();
      setAccount(accounts[0]);
      setSuccess('Wallet connected successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createMarket = async (e) => {
    e.preventDefault();
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const ethereum = getEthereumProvider();
      if (!ethereum) {
        throw new Error('MetaMask not found');
      }

      // Convert end time to timestamp
      const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);
      
      // Contract ABI for createMarket function
      const createMarketData = `0x${
        // Function selector for createMarket(string,uint256)
        '1234567890abcdef1234567890abcdef12345678' + 
        // Encoded parameters would go here - simplified for demo
        '0'.repeat(64)
      }`;

      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: PREDICTION_MARKET_ADDRESS,
          data: createMarketData,
          gas: '0x76c0', // 30400
        }],
      });

      setSuccess(`Market creation transaction sent: ${txHash}`);
      setQuestion('');
      setEndTime('');
    } catch (err) {
      setError(`Error creating market: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resolveMarket = async (e) => {
    e.preventDefault();
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const ethereum = getEthereumProvider();
      if (!ethereum) {
        throw new Error('MetaMask not found');
      }

      // Contract ABI for resolveMarket function - simplified
      const resolveMarketData = `0x${'abcdef1234567890abcdef1234567890abcdef12' + '0'.repeat(64)}`;

      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: PREDICTION_MARKET_ADDRESS,
          data: resolveMarketData,
          gas: '0x76c0',
        }],
      });

      setSuccess(`Market resolution transaction sent: ${txHash}`);
      setMarketId('');
      setOutcome('');
    } catch (err) {
      setError(`Error resolving market: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">TrustBet Admin</h1>
            <p className="text-white/70">Enter admin password to continue</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin Password"
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
              />
            </div>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main admin dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">TrustBet Admin Panel</h1>
              <p className="text-white/70">Manage prediction markets on Intuition testnet</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg border border-red-500/50 hover:bg-red-500/30 transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-200">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6 text-green-200">
            {success}
          </div>
        )}

        {/* Wallet Connection */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Wallet Connection</h2>
          {account ? (
            <div className="text-white">
              <p className="mb-2">Connected: <span className="text-green-400">{account}</span></p>
              <p className="text-sm text-white/70">Network: Intuition Testnet</p>
            </div>
          ) : (
            <button
              onClick={connectMetaMask}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect MetaMask'}
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Market */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Create New Market</h2>
            <form onSubmit={createMarket} className="space-y-4">
              <div>
                <label className="block text-white/70 mb-2">Question</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Will Bitcoin reach $100k by end of 2025?"
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  required
                />
              </div>
              
              <div>
                <label className="block text-white/70 mb-2">Betting End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !account}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Market'}
              </button>
            </form>
          </div>

          {/* Resolve Market */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Resolve Market</h2>
            <form onSubmit={resolveMarket} className="space-y-4">
              <div>
                <label className="block text-white/70 mb-2">Market ID</label>
                <input
                  type="number"
                  value={marketId}
                  onChange={(e) => setMarketId(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  required
                />
              </div>
              
              <div>
                <label className="block text-white/70 mb-2">Outcome</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  required
                >
                  <option value="">Select outcome</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={loading || !account}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Resolving...' : 'Resolve Market'}
              </button>
            </form>
          </div>
        </div>

        {/* Contract Info */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-6 mt-6">
          <h2 className="text-xl font-bold text-white mb-4">Contract Information</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/70">PredictionMarket:</p>
              <p className="text-white font-mono">{PREDICTION_MARKET_ADDRESS}</p>
            </div>
            <div>
              <p className="text-white/70">WTRUST:</p>
              <p className="text-white font-mono">{WTRUST_ADDRESS}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}