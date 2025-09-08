'use client'

import { useState } from 'react'

interface BetModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (amount: string, side: boolean) => void
  marketQuestion: string
  side: 'YES' | 'NO'
}

export default function BetModal({ isOpen, onClose, onConfirm, marketQuestion, side }: BetModalProps) {
  const [amount, setAmount] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)

  if (!isOpen) return null

  const handleBet = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    setShowConfirmation(true)
  }

  const confirmBet = () => {
    onConfirm(amount, side === 'YES')
    setShowConfirmation(false)
    setAmount('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 max-w-md w-full mx-4">
        {!showConfirmation ? (
          <>
            <h3 className="text-xl font-bold text-white mb-4">Place Bet - {side}</h3>
            <p className="text-blue-200 mb-4 text-sm">{marketQuestion}</p>
            
            <div className="mb-4">
              <label className="block text-white font-medium mb-2">Amount (WTRUST)</label>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300"
                step="0.01"
                min="0"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBet}
                className={`flex-1 ${side === 'YES' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white py-3 rounded-lg font-medium transition-colors`}
              >
                Bet {side}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold text-white mb-4">Confirm Your Bet</h3>
            
            <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
              <div className="text-sm text-gray-300 mb-2">Market:</div>
              <div className="text-white font-medium mb-3">{marketQuestion}</div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-300">Side:</span>
                  <div className={`font-bold ${side === 'YES' ? 'text-green-400' : 'text-red-400'}`}>{side}</div>
                </div>
                <div>
                  <span className="text-gray-300">Amount:</span>
                  <div className="text-white font-bold">{amount} WTRUST</div>
                </div>
              </div>
            </div>

            <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200 text-sm">
                ⚠️ <strong>Are you sure you want to bet this?</strong>
                <br />
                This amount will be taken from your WTRUST balance immediately when confirmed.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={confirmBet}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Confirm Bet
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}