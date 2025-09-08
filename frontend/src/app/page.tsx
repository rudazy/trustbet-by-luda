'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import BetModal from '@/components/BetModal'
import { CONTRACT_ADDRESSES, PREDICTION_MARKET_ABI, WTRUST_ABI, NETWORK_CONFIG } from '@/lib/contracts'

export default function Home() {
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null)
  const [betModal, setBetModal] = useState({ isOpen: false, side: 'YES' as 'YES' | 'NO', marketId: 1 })

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        setConnectedAccount(accounts[0])
      } catch (error) {
        console.error('Failed to connect wallet:', error)
        alert('Failed to connect wallet. Make sure MetaMask is installed.')
      }
    } else {
      alert('Please install MetaMask!')
    }
  }

  const handleBet = async (amount: string, side: boolean) => {
    if (!connectedAccount) {
      alert('Please connect your wallet first!')
      return
    }
    // Simplified for now - just show success
    alert(`Bet of ${amount} WTRUST on ${side ? 'YES' : 'NO'} will be processed!`)
  }

  const wrapTRUST = async () => {
    if (!connectedAccount) {
      alert('Please connect your wallet first!')
      return
    }
    const amount = prompt('Enter amount of tTRUST to wrap:')
    if (amount) {
      alert(`Wrapping ${amount} tTRUST to WTRUST...`)
    }
  }

  const viewPositions = () => {
    if (!connectedAccount) {
      alert('Please connect your wallet first!')
      return
    }
    alert('Your positions will be displayed here. Connect to Intuition testnet to see real data.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TB</span>
            </div>
            <h1 className="text-2xl font-bold text-white">TrustBet by Luda</h1>
          </div>
          
          <button
            onClick={connectWallet}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
          >
            {connectedAccount ? `${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}` : 'Connect Wallet'}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">Predict the Future</h2>
          <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
            Binary prediction markets on Intuition testnet. Bet with WTRUST, gasless transactions via relayer.
          </p>
        </div>

        {/* Active Market */}
        <div className="mb-8">
          <h3 className="text-3xl font-bold text-white mb-6">Active Markets</h3>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-4">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-xl font-bold text-white">we shall win?</h4>
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">Open</span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-300 font-medium">YES</span>
                  <span className="text-white font-bold">50%</span>
                </div>
                <div className="text-sm text-green-200">Pool: 0.00 WTRUST</div>
              </div>
              
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-red-300 font-medium">NO</span>
                  <span className="text-white font-bold">50%</span>
                </div>
                <div className="text-sm text-red-200">Pool: 0.00 WTRUST</div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => setBetModal({ isOpen: true, side: 'YES', marketId: 1 })}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Bet YES
              </button>
              <button 
                onClick={() => setBetModal({ isOpen: true, side: 'NO', marketId: 1 })}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Bet NO
              </button>
            </div>
          </div>
        </div>

        {/* Utility Buttons */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h4 className="text-white font-bold text-lg mb-3">Wrap tTRUST</h4>
            <p className="text-blue-200 mb-4">Convert native tTRUST to WTRUST for betting</p>
            <button 
              onClick={wrapTRUST}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Wrap Now
            </button>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h4 className="text-white font-bold text-lg mb-3">Your Positions</h4>
            <p className="text-blue-200 mb-4">View and claim your winning bets</p>
            <button 
              onClick={viewPositions}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg font-medium transition-colors"
            >
              View Positions
            </button>
          </div>
        </div>
      </main>

      {/* Bet Modal */}
      <BetModal
        isOpen={betModal.isOpen}
        onClose={() => setBetModal({ ...betModal, isOpen: false })}
        onConfirm={handleBet}
        marketQuestion="we shall win?"
        side={betModal.side}
      />
    </div>
  )
}