'use client'

import { useState } from 'react'

export default function AdminPanel() {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [password, setPassword] = useState('')
  const [newMarket, setNewMarket] = useState({ question: '', closeTime: '' })
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState('')
const connectWallet = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      
      // Switch to Intuition network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x351B' }]
        })
      } catch (switchError) {
        if (switchError.code === 4902) {
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
      alert('Wallet connected successfully!')
    } catch (error) {
      alert('Failed to connect wallet')
    }
  } else {
    alert('Please install MetaMask!')
  }
}
        
        setAccount(accounts[0])
        setIsConnected(true)
        alert('Wallet connected successfully!')
      } catch (error) {
        alert('Failed to connect wallet')
      }
    } else {
      alert('Please install MetaMask!')
    }
  }

  const createMarket = () => {
    if (!newMarket.question || !newMarket.closeTime) {
      alert('Please fill in all fields')
      return
    }
    
    alert(`Market "${newMarket.question}" ready to create!\nUse MetaMask to call createMarket() on: 0x90afF0acfF0Cb40EaB7Fc3bc1f4C054399d95D23`)
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
          />
          <button 
            onClick={() => password === "trustbet_admin_2025" ? setIsAuthorized(true) : alert('Wrong password')}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg"
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
            <button
              onClick={connectWallet}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              {isConnected ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
            </button>
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
          <h2 className="text-xl font-bold text-white mb-4">Contract Information</h2>
          <div className="text-sm text-gray-300 space-y-2">
            <div>WTRUST: 0x06cB08C9A108B590F292Ff711EF2B702EC07747C</div>
            <div>PredictionMarket: 0x90afF0acfF0Cb40EaB7Fc3bc1f4C054399d95D23</div>
            <div>Network: Intuition Testnet (Chain ID: 13579)</div>
            <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Create New Market</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Market question"
              value={newMarket.question}
              onChange={(e) => setNewMarket({...newMarket, question: e.target.value})}
              className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300"
            />
            <input
              type="datetime-local"
              value={newMarket.closeTime}
              onChange={(e) => setNewMarket({...newMarket, closeTime: e.target.value})}
              className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white"
            />
            <button
              onClick={createMarket}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium"
            >
              Create Market
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}