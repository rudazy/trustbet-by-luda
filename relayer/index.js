const express = require('express');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
app.use(express.json());

// CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const provider = new ethers.JsonRpcProvider('http://testnet.rpc.intuition.systems');
const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);

const PREDICTION_MARKET_ABI = [
  "function betWithPermit(uint256,bool,uint256,uint256,uint8,bytes32,bytes32)"
];

app.post('/bet', async (req, res) => {
  try {
    const { marketId, side, amount, deadline, v, r, s } = req.body;
    
    console.log('Processing bet:', { marketId, side, amount });
    
    const contract = new ethers.Contract(
      process.env.PREDICTION_MARKET_ADDRESS,
      PREDICTION_MARKET_ABI,
      relayerWallet
    );

    const tx = await contract.betWithPermit(marketId, side, amount, deadline, v, r, s);
    console.log('Transaction sent:', tx.hash);
    
    await tx.wait();
    console.log('Transaction confirmed');

    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error('Relayer error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', relayer: relayerWallet.address });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`TrustBet Relayer running on port ${PORT}`);
  console.log(`Relayer address: ${relayerWallet.address}`);
});