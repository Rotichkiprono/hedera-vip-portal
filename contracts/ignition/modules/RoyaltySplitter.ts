import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import * as dotenv from "dotenv";
import * as path from "path";
import { ethers } from "ethers";
import { fileURLToPath } from "url";

// Load the root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export default buildModule("RoyaltySplitterModule", (m) => {
    const privateKey = process.env.TREASURY_PRIVATE_KEY_ECDSA;
    const htsTokenAddress = process.env.HTS_TOKEN_ADDRESS;

    if (!privateKey || !htsTokenAddress) {
        throw new Error("Missing required environment variables in .env");
    }

    // Derive the Treasury EVM Address directly from your private key
    const wallet = new ethers.Wallet(privateKey);
    const treasuryEvmAddress = wallet.address;

    // Configure Payees and Splits
    // 7000 bps = 70% (Artist), 3000 bps = 30% (Platform) - Must sum to 10000
    const artistEvmAddress = "0x1111111111111111111111111111111111111111"; // Placeholder
    const payees = [artistEvmAddress, treasuryEvmAddress];
    const sharesBps = [7000, 3000];

    // Set Ticket Price (10 HBAR = 10 * 10^18 Wei)
    const ticketPriceHbar = ethers.parseEther("10.0");

    // Deploy the Contract
    const royaltySplitter = m.contract("RoyaltySplitter", [
        payees,
        sharesBps,
        treasuryEvmAddress,
        htsTokenAddress,
        ticketPriceHbar
    ]);

    return { royaltySplitter };
});