export const CONTRACT_ADDRESSES = {
  WTRUST: '0x06cB08C9A108B590F292Ff711EF2B702EC07747C',
  PREDICTION_MARKET: '0x90afF0acfF0Cb40EaB7Fc3bc1f4C054399d95D23',
}

export const NETWORK_CONFIG = {
  chainId: 13579,
  name: 'Intuition Testnet',
  rpc: 'http://testnet.rpc.intuition.systems',
  explorer: 'http://testnet.explorer.intuition.systems',
  currency: 'tTRUST'
}

export const WTRUST_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function permit(address,address,uint256,uint256,uint8,bytes32,bytes32)",
  "function nonces(address) view returns (uint256)",
  "function DOMAIN_SEPARATOR() view returns (bytes32)",
  "function deposit() payable",
  "function withdraw(uint256)"
]

export const PREDICTION_MARKET_ABI = [
  "function betWithPermit(uint256,bool,uint256,uint256,uint8,bytes32,bytes32)",
  "function getMarket(uint256) view returns (string,uint256,uint256,uint256,bool,bool)",
  "function getUserBets(uint256,address) view returns (uint256,uint256,bool)",
  "function claim(uint256)",
  "function createMarket(string,uint256) returns (uint256)",
  "function resolveMarket(uint256,bool)",
  "function nextMarketId() view returns (uint256)"
]

// Mock data for demo when RPC is unavailable
export const MOCK_MARKETS = [
  {
    id: 1,
    question: "we shall win?",
    closeTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    yesPool: "0.0",
    noPool: "0.0",
    resolved: false,
    outcome: false
  }
]