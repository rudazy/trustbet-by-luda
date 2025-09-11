'use client'

import { useState } from 'react'
import { ethers } from 'ethers'

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isMetaMask?: boolean
    }
  }
}

const CONTRACT_ADDRESSES = {
  WTRUST: '0x06cB08C9A108B590F292Ff711EF2B702EC07747C',
  PREDICTION_MARKET: '0x90afF0acfF0Cb40EaB7Fc3bc1f4C054399d95D23'
}

const PREDICTION_MARKET_ABI = [
  "function createMarket(string,uint256) returns (uint256)",
  "function resolveMarket(uint256,bool)",
  "function nextMarketId() view returns (uint256)",
  "function getMarket(uint256) view returns (string,uint256,uint256,uint256,bool,bool)"
]

interface Market {
  id: number
  question: string
  closeTime: Date
  yesPool: string
  noPool: string
  resolved: boolean
  outcome: boolean
}

export default function AdminPanel() {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [password, setPassword] = useState('')
  const [newMarket, setNewMarket] = useState({
    question: '',
    closeTime: ''
  })
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState('')
  const [activeMarkets, setActiveMarkets] = useState<Market[]>([])

  const ADMIN_PASSWORD = "trustbet_admin_2025"

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthorized(true)
    } else {
      alert('Incorrect password')
    }
  }

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x351B' }]
          })
        } catch (switchError) {
          const error = switchError as { code: number }
          if (error.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x351B',
                chainName: 'Intuition Testnet',
                nativeCurrency: { name: 'tTRUST', symbol: 'tTRUST', decimals: 18 },
                rpcUrls: ['http://testnet.rpc.intuition.systems'],
                blockExplorerUrls: ['http://testnet.explorer.intuition.systems']
              }]
            })
          }
        }
        
        setAccount(accounts[0])
        setIsConnected(true)
        await loadMarkets()
      } catch (error) {
        console.error('Failed to connect wallet:', error)
        alert('Failed to connect wallet')
      }
    } else {
      alert('Please install MetaMask!')
    }
  }

  const loadMarkets = async () => {
    try {
      if (!window.ethereum) return
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.PREDICTION_MARKET, PREDICTION_MARKET_ABI, provider)
      
      const nextId = await contract.nextMarketId()
      const markets: Market[] = []
      
      for (let i = 1; i < nextId; i++) {
        const market = await contract.getMarket(i)
        markets.push({
          id: i,
          question: market[0],
          closeTime: new Date(Number(market[1]) * 1000),
          yesPool: ethers.formatEther(market[2]),
          noPool: ethers.formatEther(market[3]),
          resolved: market[4],
          outcome: market[5]
        })
      }
      
      setActiveMarkets(markets)
    } catch (error) {
      console.error('Error loading markets:', error)
    }
  }

  const createMarket = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    if (!newMarket.question || !newMarket.closeTime) {
      alert('Please fill in all fields')
      return
    }

    try {
      if (!window.ethereum) return
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.PREDICTION_MARKET, PREDICTION_MARKET_ABI, signer)

      const closeTimestamp = Math.floor(new Date(newMarket.closeTime).getTime() / 1000)
      
      const tx = await contract.createMarket(newMarket.question, closeTimestamp)
      alert('Transaction sent! Waiting for confirmation...')
      
      await tx.wait()
      alert('Market created successfully!')
      
      setNewMarket({ question: '', closeTime: '' })
      await loadMarkets()
    } catch (error) {
      console.error('Error creating market:', error)
      alert('Error creating market: ' + String(error))
    }
  }

  const resolveMarket = async (marketId: number, outcome: boolean) => {
    try {
      if (!window.ethereum) return
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.PREDICTION_MARKET, PREDICTION_MARKET_ABI, signer)

      const tx = await contract.resolveMarket(marketId, outcome)
      alert('Resolving market...')
      
      await tx.wait()
      alert(`Market resolved! ${outcome ? 'YES' : 'NO'} wins.`)
      
      await loadMarkets()
    } catch (error) {
      console.error('Error resolving market:', error)
      alert('Error resolving market: ' + String(error))
    }
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Access</h1>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 mb-4"
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 rounded-lg font-medium transition-all"
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">TrustBet Admin Panel</h1>
          <div className="flex space-x-4">
            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Connect Wallet
              </button>
            ) : (
              <span className="text-white">{account.slice(0, 6)}...{account.slice(-4)}</span>
            )}
            <button
              onClick={() => setIsAuthorized(false)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Create New Market</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">Question</label>
              <input
                type="text"
                placeholder="Will Bitcoin reach $100,000 by end of 2025?"
                value={newMarket.question}
                onChange={(e) => setNewMarket({...newMarket, question: e.target.value})}
                className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300"
              />
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2">Close Time</label>
              <input
                type="datetime-local"
                value={newMarket.closeTime}
                onChange={(e) => setNewMarket({...newMarket, closeTime: e.target.value})}
                className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white"
              />
            </div>
            
            <button
              onClick={createMarket}
              disabled={!isConnected}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {isConnected ? 'Create Market' : 'Connect Wallet First'}
            </button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Active Markets ({activeMarkets.length})</h2>
          
          {activeMarkets.length === 0 ? (
            <p className="text-gray-300">No markets found. Create your first market above.</p>
          ) : (
            <div className="space-y-4">
              {activeMarkets.map((market) => (
                <div key={market.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-white font-medium">{market.question}</h3>
                    <span className={`px-2 py-1 rounded text-sm ${
                      market.resolved ? 'bg-gray-500' : 'bg-green-500'
                    } text-white`}>
                      {market.resolved ? 'Resolved' : 'Open'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 mb-4">
                    <div>YES Pool: {parseFloat(market.yesPool).toFixed(2)} WTRUST</div>
                    <div>NO Pool: {parseFloat(market.noPool).toFixed(2)} WTRUST</div>
                    <div>Market ID: {market.id}</div>
                    <div>Closes: {market.closeTime.toLocaleDateString()}</div>
                  </div>
                  
                  {!market.resolved && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => resolveMarket(market.id, true)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium transition-colors"
                      >
                        Resolve YES
                      </button>
                      <button
                        onClick={() => resolveMarket(market.id, false)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors"
                      >
                        Resolve NO
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}