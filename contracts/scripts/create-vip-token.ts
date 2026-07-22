import {
    Client,
    TokenCreateTransaction,
    TokenType,
    PrivateKey,
    AccountId
} from "@hiero-ledger/sdk";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

// Load the root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
    // 1. Initialize the Hiero Client for Hedera Testnet
    const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY!);

    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    console.log("Creating VIP Access Token on Hedera Testnet...");

    // 2. Build the Token Creation Transaction
    // We are creating a Fungible token with 0 decimals to act as a discrete VIP Pass.
    const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName("Hedera VIP Pass")
        .setTokenSymbol("HVIP")
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(0)
        .setInitialSupply(10000) // 10,000 Total VIP Passes
        .setTreasuryAccountId(operatorId)
        .setAdminKey(operatorKey) // Allows you to update the token later
        .setSupplyKey(operatorKey) // Allows minting more later if needed
        .freezeWith(client);

    // 3. Sign and Execute
    const signedTx = await tokenCreateTx.sign(operatorKey);
    const txResponse = await signedTx.execute(client);

    // 4. Get the Receipt and Token ID
    const receipt = await txResponse.getReceipt(client);
    const tokenId = receipt.tokenId;

    if (!tokenId) {
        throw new Error("Token creation failed.");
    }

    // 5. Convert Hedera Token ID to EVM Address (Solidity format)
    const tokenEvmAddress = "0x" + tokenId.toSolidityAddress();

    console.log(`\n✅ VIP Token Created Successfully!`);
    console.log(`-----------------------------------`);
    console.log(`Hedera Token ID: ${tokenId.toString()}`);
    console.log(`EVM Address: ${tokenEvmAddress}`);
    console.log(`-----------------------------------`);
    console.log(`\nACTION REQUIRED: Add the EVM Address to your .env file as HTS_TOKEN_ADDRESS=${tokenEvmAddress}`);

    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});