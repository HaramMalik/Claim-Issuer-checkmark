# Nomis Claim Issuer (OnChainID)

This is a Next.js application that acts as a Claim Issuer for the OnChainID protocol (ERC-3643).
It allows users to verify their Nomis Reputation Score and issue a corresponding claim to their on-chain identity.

## Prerequisites

- **Node.js** and **npm** installed.
- **Metamask** installed.
- **Polygon Amoy (Testnet)** MATIC for gas.
- An existing **OnChainID** (Identity Contract) deployed on Polygon Amoy.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
   *Note: If `npm` is missing, please ensure Node.js is correctly installed in your PATH.*

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

- **Environment Variables**:
    - `ISSUER_PRIVATE_KEY`: **Required**. The private key of the wallet that acts as the Claim Issuer.
    - `NOMIS_API_KEY`: **Optional**. For future real API integration.

  Copy `.env.example` to `.env` locally:
  ```bash
  cp .env.example .env
  ```

## Deploy on Vercel

The easiest way to deploy this app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-repo%2Fnomis-onchainid-issuer)

1.  Push this code to a GitHub repository.
2.  Import the project in Vercel.
3.  **Deploy!** (It will work immediately with a Demo Issuer Key).
4.  *Optional*: For production, add `ISSUER_PRIVATE_KEY` in Vercel Settings.

## Usage

1. **Connect Wallet**: Click "Connect Wallet" (ensure you are on Polygon Amoy).
2. **Enter Identity**: Paste your OnChainID contract address.
3. **Check Score**: The app checks if your wallet has a sufficient Nomis score (Mock > 40).
4. **Add Claim**: If eligible, click "Add Claim to OnChainID". This triggers a transaction on your Identity contract to register the claim signed by the Issuer.
