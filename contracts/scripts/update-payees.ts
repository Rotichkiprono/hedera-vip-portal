import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// 1. Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 2. Load the .env file from the root directory
dotenv.config({ path: resolve(__dirname, "../../.env") });

async function main() {
    // 3. Pull directly from your environment variables
    const privateKey = process.env.TREASURY_PRIVATE_KEY_ECDSA!;
    const contractAddress = process.env.NEXT_PUBLIC_ROYALTY_SPLITTER_ADDRESS!;
    const rpcUrl = process.env.HEDERA_JSON_RPC_URL!;

    // 4. Initialize Standard Ethers Provider and Wallet (No Hardhat injection required)
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("Updating payees for RoyaltySplitter at:", contractAddress);

    // 5. Define the minimal ABI needed for the update
    const abi = [
        "function setPayees(address[] memory _payees, uint256[] memory _sharesBps) external"
    ];

    // 6. Connect to the contract
    const splitter = new ethers.Contract(contractAddress, abi, wallet);

    // 7. Set 100% of the split to your valid treasury address to prevent the 0x1111 revert
    const validTreasuryAddress = wallet.address;
    const payees = [validTreasuryAddress];
    const sharesBps = [10000]; // 100% (10,000 basis points)

    // 8. Execute the update directly to the Hedera network
    const tx = await splitter.setPayees(payees, sharesBps, { gasLimit: 500000 });
    console.log("Transaction sent! Hash:", tx.hash);

    await tx.wait();
    console.log("✅ Payees updated successfully to a valid Hedera address!");
}

main().catch(console.error);