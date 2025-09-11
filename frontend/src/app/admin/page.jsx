'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { connectWallet, switchToIntuitionTestnet, getCurrentAccount, getEthereumProvider } from '../../utils/ethereum';
import { PREDICTION_MARKET_ABI, CONTRACT_ADDRESSES } from '../../utils/contracts';

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
  
  // Markets list
  const [markets, setMarkets] = useState([]);

  useEffect(() => {
    // Check if already authenticated
    const authStatus = localStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    
    // Check wallet connection
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (isAuthenticated && account) {
      loadMarkets();
    }
  }, [isAuthenticated, account]);

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

  const getContract = async () => {
    const ethereum = getEthereumProvider();
    if (!ethereum) throw new Error('MetaMask not found');
    
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    
    return new ethers.Contract(
      CONTRACT_ADDRESSES.PREDICTION_MARKET,
      PREDICTION_MARKET_ABI,
      signer
    );
  };

  const loadMarkets = async () => {
    try {
      const contract = await getContract();
      const marketCount = await contract.getMarketCount();
      const marketList = [];
      
      for (let i = 0; i < marketCount.toNumber(); i++) {
        try {
          const market = await contract.getMarket(i);
          marketList.push({
            id: i,
            question: market.question,
            totalYesBets: ethers.utils.formatEther(market.totalYesBets),
            totalNoBets: ethers.utils.formatEther(market.totalNoBets),
            bettingEndTime: new Date(market.bettingEndTime.toNumber() * 1000).toLocaleString(),
            resolved: market.resolved,
            outcome: market.outcome,
            active: market.active
          });
        } catch (err) {
          console.error(`Error loading market ${i}:`, err);
        }
      }
      
      setMarkets(marketList);
    } catch (err) {
      console.error('Error loading markets:', err);
    }
  };

  const debugContractIssue = async () => {
    try {
      setLoading(true);
      setError('');
      
      const ethereum = getEthereumProvider();
      const provider = new ethers.providers.Web3Provider(ethereum);
      
      console.log('=== CONTRACT DEBUG ===');
      console.log('Contract Address:', CONTRACT_ADDRESSES.PREDICTION_MARKET);
      console.log('Your Account:', account);
      
      // 1. Check if contract exists
      const code = await provider.getCode(CONTRACT_ADDRESSES.PREDICTION_MARKET);
      console.log('Contract exists:', code !== '0x');
      console.log('Code length:', code.length);
      
      if (code === '0x') {
        setError('❌ Contract not deployed at this address!');
        return;
      }
      
      // 2. Try different function calls to see what works
      const testABIs = [
        ["function owner() view returns (address)"],
        ["function getMarketCount() view returns (uint256)"],
      ];
      
      for (let i = 0; i < testABIs.length; i++) {
        try {
          const testContract = new ethers.Contract(CONTRACT_ADDRESSES.PREDICTION_MARKET, testABIs[i], provider);
          
          if (i === 0) {
            const owner = await testContract.owner();
            console.log('✅ Owner function works. Owner:', owner);
            console.log('Are you owner?', owner.toLowerCase() === account.toLowerCase());
            setSuccess(`Contract found! Owner: ${owner}. You are ${owner.toLowerCase() === account.toLowerCase() ? '' : 'NOT '}the owner.`);
          } else if (i === 1) {
            const count = await testContract.getMarketCount();
            console.log('✅ getMarketCount works. Count:', count.toString());
          }
        } catch (err) {
          console.log(`❌ Test ${i} failed:`, err.message);
        }
      }
      
      // 3. Check your account balance
      const balance = await provider.getBalance(account);
      console.log('Your tTRUST balance:', ethers.utils.formatEther(balance));
      
      if (balance.isZero()) {
        setError('❌ You have 0 tTRUST! You need testnet tokens to pay for gas.');
      }
      
    } catch (err) {
      console.error('Debug failed:', err);
      setError(`Debug error: ${err.message}`);
    } finally {
      setLoading(false);
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
      
      const contract = await getContract();
      
      // Convert end time to timestamp
      const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);
      
      console.log('Creating market:', question, endTimestamp);
      
      // Call createMarket function
      const tx = await contract.createMarket(question, endTimestamp, {
        gasLimit: 500000 // Set gas limit
      });
      
      setSuccess(`Market creation transaction sent: ${tx.hash}`);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      setSuccess(`Market created successfully! Transaction: ${tx.hash}`);
      setQuestion('');
      setEndTime('');
      
      // Reload markets
      setTimeout(() => loadMarkets(), 2000);
      
    } catch (err) {
      console.error('Error creating market:', err);
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
      
      const contract = await getContract();
      
      console.log('Resolving market:', marketId, outcome === 'true');
      
      // Call resolveMarket function
      const tx = await contract.resolveMarket(
        parseInt(marketId), 
        outcome === 'true',
        {
          gasLimit: 300000
        }
      );

      setSuccess(`Market resolution transaction sent: ${tx.hash}`);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      setSuccess(`Market resolved successfully! Transaction: ${tx.hash}`);
      setMarketId('');
      setOutcome('');
      
      // Reload markets
      setTimeout(() => loadMarkets(), 2000);
      
    } catch (err) {
      console.error('Error resolving market:', err);
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
              <div className="flex gap-2 mt-2">
                <button
                  onClick={loadMarkets}
                  className="bg-blue-500/20 text-blue-200 px-4 py-2 rounded-lg border border-blue-500/50 hover:bg-blue-500/30 transition-all"
                >
                  Refresh Markets
                </button>
                <button
                  onClick={debugContractIssue}
                  disabled={loading}
                  className="bg-yellow-500/20 text-yellow-200 px-4 py-2 rounded-lg border border-yellow-500/50 hover:bg-yellow-500/30 transition-all disabled:opacity-50"
                >
                  🔍 Debug Contract
                </button>
              </div>
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

        <div className="grid md:grid-cols-2 gap-6 mb-6">
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

        {/* Markets List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Existing Markets</h2>
          {markets.length === 0 ? (
            <p className="text-white/70">No markets found. Create your first market above!</p>
          ) : (
            <div className="space-y-4">
              {markets.map((market) => (
                <div key={market.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-semibold">#{market.id}: {market.question}</h3>
                    <div className="flex gap-2">
                      {market.resolved ? (
                        <span className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded text-xs">
                          Resolved: {market.outcome ? 'Yes' : 'No'}
                        </span>
                      ) : (
                        <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-white/70">
                    <div>
                      <p>Yes Bets: {market.totalYesBets} TRUST</p>
                    </div>
                    <div>
                      <p>No Bets: {market.totalNoBets} TRUST</p>
                    </div>
                    <div>
                      <p>Ends: {market.bettingEndTime}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contract Info */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-6 mt-6">
          <h2 className="text-xl font-bold text-white mb-4">Contract Information</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/70">PredictionMarket:</p>
              <p className="text-white font-mono">{CONTRACT_ADDRESSES.PREDICTION_MARKET}</p>
            </div>
            <div>
              <p className="text-white/70">WTRUST:</p>
              <p className="text-white font-mono">{CONTRACT_ADDRESSES.WTRUST}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}