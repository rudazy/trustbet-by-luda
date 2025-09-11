// utils/contracts.js

export const PREDICTION_MARKET_ABI = [
  "function createMarket(string memory question, uint256 bettingEndTime) external returns (uint256)",
  "function resolveMarket(uint256 marketId, bool outcome) external",
  "function placeBet(uint256 marketId, bool prediction, uint256 amount) external",
  "function getMarket(uint256 marketId) external view returns (tuple(string question, uint256 totalYesBets, uint256 totalNoBets, uint256 bettingEndTime, bool resolved, bool outcome, bool active))",
  "function getMarketCount() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function feePercentage() external view returns (uint256)"
];

export const WTRUST_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)"
];

export const CONTRACT_ADDRESSES = {
  PREDICTION_MARKET: '0x90afF0acfF0Cb40EaB7Fc3bc1f4C054399d95D23',
  WTRUST: '0x06cB08C9A108B590F292Ff711EF2B702EC07747C'
};

export const INTUITION_TESTNET = {
  chainId: 13579,
  chainName: 'Intuition Testnet',
  rpcUrl: 'http://testnet.rpc.intuition.systems',
  blockExplorer: 'https://testnet.explorer.intuition.systems'
};