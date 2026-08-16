import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// 1. Recreate directory paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../.env") });

async function main() {
    const privateKey = process.env.TREASURY_PRIVATE_KEY_ECDSA!;
    const contractAddress = process.env.NEXT_PUBLIC_ROYALTY_SPLITTER_ADDRESS!;
    const rpcUrl = process.env.HEDERA_JSON_RPC_URL!;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("Executing Master Fix for RoyaltySplitter at:", contractAddress);

    // 2. Convert Hedera Token ID to EVM Address format
    const tokenId = "0.0.9669057"; // From your Supabase database
    const tokenIdNum = parseInt(tokenId.split(".")[2]);
    const evmTokenAddress = "0x" + tokenIdNum.toString(16).padStart(40, '0');
    console.log("✅ Converted Token ID to EVM Address:", evmTokenAddress);

    // 3. Grant Allowance (Approve the contract to move the Treasury's VIP tokens)
    const erc20Abi = ["function approve(address spender, uint256 amount) external returns (bool)"];
    const tokenContract = new ethers.Contract(evmTokenAddress, erc20Abi, wallet);

    console.log("Granting HTS Token allowance to contract...");

    // FIX: Using a safe integer limit to prevent Hedera int64 overflows
    const safeAllowance = 100000;
    const approveTx = await tokenContract.approve(contractAddress, safeAllowance, { gasLimit: 1000000 });
    await approveTx.wait();
    console.log("✅ Allowance granted!");

    // 4. Update Contract Configuration (Fixing the Ticket Price mismatch)
    const splitterAbi = [
        "function updateTokenConfiguration(address _htsTokenAddress, address _treasuryAccount, uint256 _ticketPriceHbar) external"
    ];
    const splitterContract = new ethers.Contract(contractAddress, splitterAbi, wallet);

    // Explicitly use 8 decimals for Hedera Tinybar (10 HBAR = 1,000,000,000 Tinybar)
    const ticketPriceWei = ethers.parseUnits("10.0");

    console.log("Synchronizing contract configuration...");
    const updateTx = await splitterContract.updateTokenConfiguration(
        evmTokenAddress,
        wallet.address, // Treasury
        ticketPriceWei,
        { gasLimit: 500000 }
    );
    await updateTx.wait();
    console.log("✅ Contract configuration perfectly synchronized!");
}

main().catch(console.error);