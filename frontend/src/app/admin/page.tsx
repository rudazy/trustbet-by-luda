'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES, PREDICTION_MARKET_ABI } from '@/lib/contracts'

export default function AdminPanel() {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [password, setPassword] = useState('')
  const [newMarket, setNewMarket] = useState({
    question: '',
    closeTime: ''
  })
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState('')
  const [markets, setMarkets] = useState([])

  const ADMIN_PASSWORD = "ludarep1" // Change this to your secure password

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthorized(true)
    } else {
      alert('Incorrect password')
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        setAccount(accounts[0])
        setIsConnected(true)
      } catch (error) {
        console.error('Failed to connect wallet:', error)
      }
    } else {
      alert('Please install MetaMask!')
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
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.PREDICTION_MARKET, PREDICTION_MARKET_ABI, signer)

      const closeTimestamp = Math.floor(new Date(newMarket.closeTime).getTime() / 1000)
      
      console.log('Creating market:', newMarket.question, closeTimestamp)
      const tx = await contract.createMarket(newMarket.question, closeTimestamp)
      
      alert('Transaction sent! Waiting for confirmation...')
      await tx.wait()
      
      alert('Market created successfully!')
      setNewMarket({ question: '', closeTime: '' })
      
    } catch (error) {
      console.error('Error creating market:', error)
      alert('Error creating market: ' + error.message)
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
      {/* Header */}
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
        {/* Contract Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Contract Information</h2>
          <div className="text-sm text-gray-300 space-y-2">
            <div>WTRUST: {CONTRACT_ADDRESSES.WTRUST}</div>
            <div>PredictionMarket: {CONTRACT_ADDRESSES.PREDICTION_MARKET}</div>
            <div>Network: Intuition Testnet (Chain ID: 13579)</div>
          </div>
        </div>

        {/* Create Market */}
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

        {/* Daily Quota */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Daily Market Quota</h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Markets created today:</span>
            <span className="text-white font-bold">0 / 2</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{width: '0%'}}></div>
          </div>
        </div>
      </main>
    </div>
  )
}