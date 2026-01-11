import { ethers } from 'ethers';
import { NextResponse } from 'next/server';
// CONSTANTS
const NOMIS_TOPIC = ethers.keccak256(ethers.toUtf8Bytes("NOMIS_REPUTATION"));
// 1 = CLAIM_TOPIC (standard), but we use custom. 
// Actually ERC3643 uses uint256 for topics.
const CLAIM_SCHEME = 1; // 1 = ECDSA from hashed data
// In a real app, this key should be in secure environment variables
// This is a RANDOM key for DEMO purposes only.
const DEMO_KEY = "0x0123456789012345678901234567890123456789012345678901234567890123";
// Use Env Var if available, otherwise fallback to Demo Key for instant preview.
const ISSUER_PRIVATE_KEY = process.env.ISSUER_PRIVATE_KEY || DEMO_KEY;
export async function POST(request: Request) {
    try {
        // In production, you would remove the fallback and strictly check for env var.
        if (!ISSUER_PRIVATE_KEY) {
            // This block is now unreachable with the fallback, but good practice.
            return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
        }
        const { identityAddress, userWalletAddress } = await request.json();
        if (!identityAddress || !userWalletAddress) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }
        // 1. Check Nomis Score
        // In production, call Nomis API: https://api.nomis.cc/api/v1/polygon/wallet/.../score
        // For MVP/Demo: Mock check.
        const score = Math.floor(Math.random() * 100);
        const minScore = 40;
        // Simulate API delay
        await new Promise(r => setTimeout(r, 1000));
        if (score < minScore) {
            return NextResponse.json({
                eligible: false,
                score,
                message: `Nomis score ${score} is below minimum ${minScore}.`
            });
        }
        // 2. Prepare Claim Data
        // We sign: keccak256(abi.encodePacked(identityAddress, topic, data))
        const issuerWallet = new ethers.Wallet(ISSUER_PRIVATE_KEY);
        // Data can be the hash of the off-chain credential (e.g., the JSON from Nomis)
        // Here we just use a hash representing "Verified > 40"
        const data = ethers.keccak256(ethers.toUtf8Bytes(`Nomis Score: ${score}`));
        // MATCHING SOLIDITY: keccak256(abi.encode(identity, topic, data))
        // NOT encodePacked!
        const abiCoder = new ethers.AbiCoder();
        const messageHash = ethers.keccak256(
            abiCoder.encode(
                ["address", "uint256", "bytes"],
                [identityAddress, NOMIS_TOPIC, data]
            )
        );
        // Sign the hash (binary)
        // Wallet.signMessage adds the prefix "\x19Ethereum Signed Message:\n32" automatically.
        const signature = await issuerWallet.signMessage(ethers.getBytes(messageHash));
        return NextResponse.json({
            eligible: true,
            score,
            claim: {
                topic: NOMIS_TOPIC,
                scheme: CLAIM_SCHEME,
                issuer: issuerWallet.address,
                signature: signature,
                data: data,
                uri: "https://nomis.cc/claim-metadata" // Optional URI
            }
        });
    } catch (error) {
        console.error("Claim issuance error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

