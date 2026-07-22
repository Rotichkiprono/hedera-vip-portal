import {
    Client,
    AccountAllowanceApproveTransaction,
    PrivateKey,
    AccountId,
    TokenId,
    ContractId
} from "@hiero-ledger/sdk";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
    const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY!);

    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    // Your specific Token ID from the previous step
    const tokenId = TokenId.fromString("0.0.9669057");

    // The newly deployed RoyaltySplitter contract
    const contractEvmAddress = process.env.NEXT_PUBLIC_ROYALTY_SPLITTER_ADDRESS!;
    const contractLookupResponse = await fetch(
        `${client.mirrorRestApiBaseUrl}/contracts/${contractEvmAddress}`,
    );

    if (!contractLookupResponse.ok) {
        throw new Error(
            `Unable to resolve contract ID for ${contractEvmAddress} from mirror node`,
        );
    }

    const contractLookup = await contractLookupResponse.json();
    const spenderContractId = ContractId.fromString(contractLookup.contract_id);

    console.log(`Granting allowance to Contract: ${contractEvmAddress}...`);

    const tx = new AccountAllowanceApproveTransaction()
        .approveTokenAllowance(
            tokenId,
            operatorId,
            spenderContractId,
            10000 // Total amount the contract is allowed to spend
        )
        .freezeWith(client);

    const signedTx = await tx.sign(operatorKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log(`✅ Allowance granted successfully! Status: ${receipt.status.toString()}`);
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});