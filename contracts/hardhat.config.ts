import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";
import * as dotenv from "dotenv";

// Load the root .env file
dotenv.config({ path: "../.env" });

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    // Hedera Testnet Configuration
    hederaTestnet: {
      type: "http",
      chainType: "l1",
      url: "https://testnet.hashio.io/api", // Official Hedera JSON-RPC Relay
      accounts: process.env.TREASURY_PRIVATE_KEY_ECDSA
        ? [process.env.TREASURY_PRIVATE_KEY_ECDSA]
        : [],
    },
    // Keep local simulated network for fast local testing
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
  },
});
