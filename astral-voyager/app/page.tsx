"use client";"use client";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
// Type definition for Window
declare global {
    interface Window {
        ethereum: any;
    }
}
export default function Dashboard() {
    const [wallet, setWallet] = useState<string | null>(null);
    const [identity, setIdentity] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [scoreData, setScoreData] = useState<any>(null);
    const [txStatus, setTxStatus] = useState<string>('');
    // Auto-connect if already authorized
    useEffect(() => {
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.request({ method: 'eth_accounts' })
                .then((accounts: string[]) => {
                    if (accounts.length > 0) handleConnect();
                });
        }
    }, []);
    const handleConnect = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                // Switch Chain Logic
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x13882' }], // Polygon Amoy
                    });
                } catch (switchError: any) {
                    if (switchError.code === 4902) {
                        try {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: '0x13882',
                                    chainName: 'Polygon Amoy Testnet',
                                    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                                    rpcUrls: ['https://rpc-amoy.polygon.technology/'],
                                    blockExplorerUrls: ['https://www.oklink.com/amoy'],
                                }],
                            });
                        } catch (addError) { console.error(addError); }
                    }
                }
                const accounts = await provider.send("eth_requestAccounts", []);
                setWallet(accounts[0]);
            } catch (err) { console.error(err); }
        }
    };
    const fetchScore = async () => {
        if (!wallet || !identity) return;
        setLoading(true);
        setScoreData(null);
        try {
            const res = await fetch('/api/issue-claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userWalletAddress: wallet, identityAddress: identity })
            });
            const data = await res.json();
            setScoreData(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };
    const handleClaim = async () => {
        if (!scoreData?.claim || !wallet) return;
        try {
            setTxStatus('Preparing transaction...');
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            // EXECUTE + ADDCLAIM ABI
            const abi = [
                "function addClaim(uint256 _topic, uint256 _scheme, address _issuer, bytes _signature, bytes _data, string _uri) external returns (bytes32)",
                "function execute(address _to, uint256 _value, bytes _data) external returns (bool, bytes)"
            ];
            const contract = new ethers.Contract(identity, abi, signer);
            const { topic, scheme, issuer, signature, data, uri } = scoreData.claim;
            // Encode internal call
            const iface = new ethers.Interface(abi);
            const calldata = iface.encodeFunctionData("addClaim", [topic, scheme, issuer, signature, data, uri]);
            setTxStatus('Please confirm executing addClaim...');
            const tx = await contract.execute(identity, 0, calldata);
            setTxStatus(`Transaction Submitted: ${tx.hash}`);
            await tx.wait();
            setTxStatus('Success! Claim Added.');
        } catch (err: any) {
            console.error(err);
            setTxStatus(`Error: ${err.reason || err.message}`);
        }
    };
    return (
        <div className="dashboard-container">
            {/* Navbar */}
            <nav className="navbar">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white tracking-tight">Nomis <span className="text-blue-500">Issuer</span></h1>
                </div>
                <div>
                    {!wallet ? (
                        <button onClick={handleConnect} className="btn btn-primary">Connect Wallet</button>
                    ) : (
                        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-sm font-mono">{wallet.slice(0, 6)}...{wallet.slice(-4)}</span>
                        </div>
                    )}
                </div>
            </nav>
            <main>
                {/* Header / Context */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-2">My OnChain Identity</h2>
                    <p className="text-slate-400">Manage your identity and verifiable credentials.</p>
                </div>
                <div className="stat-grid">
                    {/* Card 1: Identity Config */}
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4 text-white">1. Identity Setup</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">OnChainID Contract Address</label>
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    value={identity}
                                    onChange={(e) => setIdentity(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-blue-500 font-mono"
                                />
                            </div>
                            {!wallet && <p className="text-sm text-yellow-500">Connect wallet to proceed</p>}
                        </div>
                    </div>
                    {/* Card 2: Nomis Score */}
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4 text-white">2. Check Qualification</h3>
                        <div className="flex flex-col h-full justify-between">
                            <div>
                                <p className="text-sm text-slate-400 mb-4">
                                    Verify your Nomis Reputation Score to receive a specialized claim.
                                </p>
                                {loading && <div className="text-blue-400 animate-pulse">Checking Score API...</div>}
                                {scoreData && (
                                    <div className="mb-4">
                                        <div className="text-sm uppercase tracking-wide text-slate-500">Current Score</div>
                                        <div className={`text-4xl font-bold ${scoreData.eligible ? 'text-green-500' : 'text-red-500'}`}>
                                            {scoreData.score} <span className="text-lg text-slate-500 font-normal">/ 100</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={fetchScore}
                                disabled={!wallet || !identity || loading}
                                className={`btn w-full ${(!wallet || !identity) ? 'btn-disabled' : 'btn-primary'}`}
                            >
                                {loading ? 'Verifying...' : 'Check Eligibility'}
                            </button>
                        </div>
                    </div>
                </div>
                {/* Action Section */}
                {scoreData?.eligible && (
                    <div className="card border-l-4 border-l-green-500">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Eligibility Confirmed!</h3>
                                <p className="text-slate-400">
                                    You can now issue the <span className="text-white font-medium">Nomis Reputation Claim</span> to your OnChainID.
                                </p>
                                <div className="mt-2 text-xs font-mono text-slate-500 p-2 bg-slate-900 rounded inline-block">
                                    Signature: {scoreData.claim.signature.slice(0, 30)}...
                                </div>
                            </div>
                            <div className="min-w-[200px]">
                                <button
                                    onClick={handleClaim}
                                    className="btn btn-primary w-full bg-green-600 hover:bg-green-700"
                                >
                                    Add Claim to OnChainID
                                </button>
                            </div>
                        </div>
                        {txStatus && (
                            <div className="mt-6 p-4 bg-slate-900 rounded border border-slate-700">
                                <p className="font-mono text-sm text-blue-400">{txStatus}</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

