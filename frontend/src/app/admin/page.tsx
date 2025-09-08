'use client'

import { useState } from 'react'

export default function AdminPanel() {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [password, setPassword] = useState('')
  const [newMarket, setNewMarket] = useState({
    question: '',
    closeTime: ''
  })

  const ADMIN_PASSWORD = "trustbet_admin_2025"

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthorized(true)
    } else {
      alert('Incorrect password')
    }
  }

  const createMarket = () => {
    if (!newMarket.question || !newMarket.closeTime) {
      alert('Please fill in all fields')
      return
    }
    alert('Market created successfully!')
    setNewMarket({ question: '', closeTime: '' })
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
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white">TrustBet Admin Panel</h1>
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
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Create Market
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}