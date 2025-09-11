'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import BetModal from '@/components/BetModal';
import { connectWallet, switchToIntuitionTestnet, getCurrentAccount, getEthereumProvider } from '../utils/ethereum';
import { PREDICTION_MARKET_ABI, CONTRACT_ADDRESSES } from '../utils/contracts';

interface Market {
  id: number;
  question: string;
  totalYesBets: string;
  totalNoBets: string;
  bettingEndTime: number;
  resolved: boolean;
  outcome: boolean;
  active: boolean;
  yesPercentage: number;
  noPercentage: number;
  timeLeft: string;
}

export default function Home() {
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [betModal, setBetModal] = useState({ 
    isOpen: false, 
    side: 'YES' as 'YES' | 'NO', 
    marketId: 0,
    marketQuestion: ''
  });

  useEffect(() => {
    checkWalletConnection();
    loadMarkets();
    
    // Update time every second
    const interval = setInterval(() => {
      setMarkets(prevMarkets => 
        prevMarkets.map(market => ({
          ...market,
          timeLeft: getTimeLeft(market.bettingEndTime)
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const checkWalletConnection = async () => {
    try {
      const currentAccount = await getCurrentAccount();
      if (currentAccount) {
        setConnectedAccount(currentAccount);
      }
    } catch (err) {
      console.error('Error checking wallet:', err);
    }
  };

  const connectMetaMask = async () => {
    try {
      setLoading(true);
      setError('');
      
      const accounts = await connectWallet();
      await switchToIntuitionTestnet();
      setConnectedAccount(accounts[0]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      console.log('Loading markets...');
      
      // Use public RPC provider to read data (no wallet needed)
      const provider = new ethers.providers.JsonRpcProvider('http://testnet.rpc.intuition.systems');
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.PREDICTION_MARKET,
        PREDICTION_MARKET_ABI,
        provider
      );

      console.log('Contract address:', CONTRACT_ADDRESSES.PREDICTION_MARKET);
      
      const marketCount = await contract.getMarketCount();
      console.log('Market count:', marketCount.toString());
      
      const marketList: Market[] = [];
      
      for (let i = 0; i < marketCount.toNumber(); i++) {
        try {
          console.log(`Loading market ${i}...`);
          const market = await contract.getMarket(i);
          
          const totalYes = parseFloat(ethers.utils.formatEther(market.totalYesBets));
          const totalNo = parseFloat(ethers.utils.formatEther(market.totalNoBets));
          const total = totalYes + totalNo;
          
          const yesPercentage = total > 0 ? (totalYes / total) * 100 : 50;
          const noPercentage = total > 0 ? (totalNo / total) * 100 : 50;
          
          marketList.push({
            id: i,
            question: market.question,
            totalYesBets: totalYes.toFixed(2),
            totalNoBets: totalNo.toFixed(2),
            bettingEndTime: market.bettingEndTime.toNumber(),
            resolved: market.resolved,
            outcome: market.outcome,
            active: market.active,
            yesPercentage: Math.round(yesPercentage),
            noPercentage: Math.round(noPercentage),
            timeLeft: getTimeLeft(market.bettingEndTime.toNumber())
          });
          
          console.log(`Market ${i} loaded:`, market.question);
        } catch (err) {
          console.error(`Error loading market ${i}:`, err);
        }
      }
      
      console.log('All markets loaded:', marketList);
      setMarkets(marketList);
    } catch (err) {
      console.error('Error loading markets:', err);
      setError(`Failed to load markets: ${err.message}`);
    }
  };

  const getTimeLeft = (endTime: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) {
      return 'Betting ended';
    }
    
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const debugContract = async () => {
    try {
      console.log('=== DEBUG CONTRACT ===');
      setError('');
      
      // Check with public RPC
      const provider = new ethers.providers.JsonRpcProvider('http://testnet.rpc.intuition.systems');
      console.log('Provider connected');
      
      const contractAddress = CONTRACT_ADDRESSES.PREDICTION_MARKET;
      console.log('Checking contract at:', contractAddress);
      
      // Check if contract exists
      const code = await provider.getCode(contractAddress);
      console.log('Contract exists:', code !== '0x');
      console.log('Code length:', code.length);
      
      if (code === '0x') {
        setError('❌ Contract not found at this address!');
        return;
      }
      
      // Try different ABIs to find what works
      const testABIs = [
        ["function getMarketCount() view returns (uint256)"],
        ["function marketCount() view returns (uint256)"],
        ["function totalMarkets() view returns (uint256)"],
        ["function markets(uint256) view returns (string, uint256, uint256, uint256, bool, bool, bool)"]
      ];
      
      for (let i = 0; i < testABIs.length; i++) {
        try {
          const testContract = new ethers.Contract(contractAddress, testABIs[i], provider);
          
          if (i === 0) {
            const count = await testContract.getMarketCount();
            console.log('✅ getMarketCount works:', count.toString());
            setError(`✅ Contract found! Markets: ${count.toString()}`);
            return;
          } else if (i === 1) {
            const count = await testContract.marketCount();
            console.log('✅ marketCount works:', count.toString());
            setError(`✅ Contract found! Markets: ${count.toString()}`);
            return;
          } else if (i === 2) {
            const count = await testContract.totalMarkets();
            console.log('✅ totalMarkets works:', count.toString());
            setError(`✅ Contract found! Markets: ${count.toString()}`);
            return;
          }
        } catch (err) {
          console.log(`❌ Test ${i} failed:`, err.message);
        }
      }
      
      setError('❌ Contract exists but no compatible functions found');
      
    } catch (err) {
      console.error('Debug error:', err);
      setError(`❌ Debug Error: ${err.message}`);
    }
  };

  const handleBet = async (amount: string, side: boolean) => {
    if (!connectedAccount) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const contract = await getContract();
      const betAmount = ethers.utils.parseEther(amount);
      
      console.log('Placing bet:', betModal.marketId, side, amount);
      
      const tx = await contract.placeBet(betModal.marketId, side, betAmount, {
        gasLimit: 300000
      });
      
      alert(`Bet transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      await tx.wait();
      
      alert(`Bet confirmed! ${amount} TRUST on ${side ? 'YES' : 'NO'}`);
      
      // Reload markets
      loadMarkets();
      
    } catch (err: any) {
      console.error('Betting error:', err);
      alert(`Betting failed: ${err.message}`);
    } finally {
      setLoading(false);
      setBetModal({ ...betModal, isOpen: false });
    }
  };

  const openBetModal = (marketId: number, side: 'YES' | 'NO', question: string) => {
    setBetModal({
      isOpen: true,
      side,
      marketId,
      marketQuestion: question
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">TrustBet by Luda</h1>
          <button 
            onClick={connectMetaMask} 
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Connecting...' : connectedAccount ? `${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}` : 'Connect Wallet'}
          </button>
        </div>
      </header>

      {/* Error/Success Alert */}
      {error && (
        <div className={`${error.includes('✅') ? 'bg-green-500/20 border-green-500/50 text-green-200' : 'bg-red-500/20 border-red-500/50 text-red-200'} border p-4 m-4 rounded-lg`}>
          {error}
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">Predict the Future</h2>
          <p className="text-xl text-blue-200">Binary prediction markets on Intuition testnet</p>
          <div className="mt-4 text-white/70 text-sm">
            <p>Contract: {CONTRACT_ADDRESSES.PREDICTION_MARKET}</p>
          </div>
        </div>

        {/* Debug Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center gap-4">
            <button 
              onClick={loadMarkets}
              disabled={loading}
              className="bg-blue-500/20 border border-blue-500/50 text-blue-200 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh Markets'}
            </button>
            <button 
              onClick={debugContract}
              className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 px-6 py-3 rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              🔍 Debug Contract
            </button>
          </div>
        </div>

        {/* Markets */}
        {markets.length === 0 ? (
          <div className="text-center">
            <div className="bg-white/10 rounded-xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4">No Markets Available</h3>
              <p className="text-white/70 mb-4">
                {error ? 'There was an error loading markets. Check the debug output above.' : 'Be the first to create a prediction market!'}
              </p>
              <p className="text-white/50 text-sm">
                Open browser console (F12) to see detailed debug information
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {markets.map((market) => (
              <div key={market.id} className="bg-white/10 rounded-xl p-6 border border-white/20">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-bold text-white">{market.question}</h4>
                  <div className="text-right">
                    {market.resolved ? (
                      <span className="bg-gray-500/20 text-gray-300 px-3 py-1 rounded-full text-sm">
                        Resolved: {market.outcome ? 'YES' : 'NO'}
                      </span>
                    ) : (
                      <div>
                        <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">
                          Active
                        </span>
                        <p className="text-white/70 text-sm mt-1">{market.timeLeft}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-green-300 font-medium">YES - {market.yesPercentage}%</span>
                      <span className="text-green-200 text-sm">{market.totalYesBets} TRUST</span>
                    </div>
                    <div className="w-full bg-green-500/10 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all" 
                        style={{ width: `${market.yesPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-red-300 font-medium">NO - {market.noPercentage}%</span>
                      <span className="text-red-200 text-sm">{market.totalNoBets} TRUST</span>
                    </div>
                    <div className="w-full bg-red-500/10 rounded-full h-2 mt-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all" 
                        style={{ width: `${market.noPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {!market.resolved && market.timeLeft !== 'Betting ended' ? (
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => openBetModal(market.id, 'YES', market.question)}
                      disabled={!connectedAccount}
                      className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Bet YES
                    </button>
                    <button 
                      onClick={() => openBetModal(market.id, 'NO', market.question)}
                      disabled={!connectedAccount}
                      className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Bet NO
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-3 text-white/50">
                    {market.resolved ? 'Market Resolved' : 'Betting Period Ended'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bet Modal */}
      <BetModal
        isOpen={betModal.isOpen}
        onClose={() => setBetModal({ ...betModal, isOpen: false })}
        onConfirm={handleBet}
        marketQuestion={betModal.marketQuestion}
        side={betModal.side}
      />
    </div>
  );
}