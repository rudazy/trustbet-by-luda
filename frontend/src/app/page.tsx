'use client'

import { useState } from 'react'
import BetModal from '@/components/BetModal'

export default function Home() {
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null)
  const [betModal, setBetModal] = useState({ isOpen: false, side: 'YES' as 'YES' | 'NO', marketId: 1 })

  const connectWallet = async () => {
    // Simplified for deployment - no TypeScript issues
    setConnectedAccount('0x1234...abcd')
  }

  const handleBet = (amount: string, side: boolean) => {
    alert(`Bet: ${amount} WTRUST on ${side ? 'YES' : 'NO'}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">TrustBet by Luda</h1>
          <button onClick={connectWallet} className="bg-blue-500 text-white px-6 py-2 rounded-lg">
            {connectedAccount ? `${connectedAccount}` : 'Connect Wallet'}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">Predict the Future</h2>
          <p className="text-xl text-blue-200">Binary prediction markets on Intuition testnet</p>
        </div>

        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <h4 className="text-xl font-bold text-white mb-4">we shall win?</h4>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <span className="text-green-300 font-medium">YES - 50%</span>
            </div>
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <span className="text-red-300 font-medium">NO - 50%</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => setBetModal({ isOpen: true, side: 'YES', marketId: 1 })} 
                    className="flex-1 bg-green-500 text-white py-3 rounded-lg">
              Bet YES
            </button>
            <button onClick={() => setBetModal({ isOpen: true, side: 'NO', marketId: 1 })}
                    className="flex-1 bg-red-500 text-white py-3 rounded-lg">
              Bet NO
            </button>
          </div>
        </div>
      </main>

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