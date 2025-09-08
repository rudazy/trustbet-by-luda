import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    intuition: {
      url: "http://testnet.rpc.intuition.systems",
      chainId: 13579,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    }
  },
  etherscan: {
    apiKey: {
      intuition: "no-api-key-needed"
    },
    customChains: [
      {
        network: "intuition",
        chainId: 13579,
        urls: {
          apiURL: "http://testnet.explorer.intuition.systems/api",
          browserURL: "http://testnet.explorer.intuition.systems"
        }
      }
    ]
  }
};

export default config;