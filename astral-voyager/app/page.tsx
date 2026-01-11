"use client";
import { useState } from 'react';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
declare global {
    interface Window {
        ethereum: any;
    }
}
export default function Home() {
    const [wallet, setWallet] = useState<string | null>(null);
    const [identity, setIdentity] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'connect' | 'input' | 'checking' | 'result'>('connect');
    const [result, setResult] = useState<any>(null);
    const [txStatus, setTxStatus] = useState<string>('');
    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                // Force Switch to Polygon Amoy (0x13882)
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x13882' }],
                    });
                } catch (switchError: any) {
                    // This error code indicates that the chain has not been added to MetaMask.
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [
                                {
                                    chainId: '0x13882',
                                    chainName: 'Polygon Amoy Testnet',
                                    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                                    rpcUrls: ['https://rpc-amoy.polygon.technology/'],
                                    blockExplorerUrls: ['https://www.oklink.com/amoy'],
                                },
                            ],
                        });
                    }
                }
                const accounts = await provider.send("eth_requestAccounts", []);
                setWallet(accounts[0]);
                setStep('input');
            } catch (err) {
                console.error("User denied connection", err);
            }
        } else {
            alert("Please install Metamask");
        }
    };
    const checkEligibility = async () => {
        if (!wallet || !identity) return;
        setLoading(true);
        setStep('checking');
        try {
            const res = await fetch('/api/issue-claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userWalletAddress: wallet,
                    identityAddress: identity
                })
            });
            const data = await res.json();
            setResult(data);
            setStep('result');
        } catch (err) {
            console.error(err);
            setStep('input');
        } finally {
            setLoading(false);
        }
    };
    const addClaimToIdentity = async () => {
        if (!result?.claim || !wallet) return;
        try {
            setTxStatus('Initiating transaction...');
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            // ABI for Identity (execute + addClaim)
            // We need to encode the call to addClaim, then pass it to execute
            const abi = [
                "function addClaim(uint256 _topic, uint256 _scheme, address _issuer, bytes _signature, bytes _data, string _uri) external returns (bytes32)",
                "function execute(address _to, uint256 _value, bytes _data) external returns (bool, bytes)"
            ];
            const identityContract = new ethers.Contract(identity, abi, signer);
            const { topic, scheme, issuer, signature, data, uri } = result.claim;
            // Encode the addClaim call
            const iface = new ethers.Interface(abi);
            const calldata = iface.encodeFunctionData("addClaim", [
                topic,
                scheme,
                issuer,
                signature,
                data,
                uri
            ]);
            setTxStatus('Please sign in wallet (Calling execute)...');
            // Call execute(identity, 0, addClaimData)
            // This makes the Identity call addClaim on itself, bypassing onlyClaimKey check (if user is manager)
            const tx = await identityContract.execute(identity, 0, calldata);
            setTxStatus(`Transaction sent! Hash: ${tx.hash}`);
            await tx.wait();
            setTxStatus('Claim successfully added to OnChainID!');
        } catch (err: any) {
            console.error(err);
            setTxStatus('Transaction failed: ' + (err.reason || err.message));
        }
    };
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[100px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px]" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 w-full max-w-md"
            >
                <div className="glass-panel p-8 text-center">
                    <h1 className="text-4xl font-bold mb-2">
                        Nomis <span className="gradient-text">Issuer</span>
                    </h1>
                    <p className="text-gray-400 mb-8">Get your OnChainID Claim based on your Reputation.</p>
                    <AnimatePresence mode="wait">
                        {step === 'connect' && (
                            <motion.div
                                key="connect"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <button onClick={connectWallet} className="primary-button w-full">
                                    Connect Wallet
                                </button>
                            </motion.div>
                        )}
                        {step === 'input' && (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="text-left">
                                    <label className="text-sm text-gray-500 ml-1">Your OnChainID Address</label>
                                    <input
                                        type="text"
                                        placeholder="0x..."
                                        value={identity}
                                        onChange={(e) => setIdentity(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                    <p className="text-xs text-gray-600 mt-1 ml-1">
                                        Don't have one? <a href="#" className="underline hover:text-indigo-400">Create one first</a>.
                                    </p>
                                </div>
                                <button
                                    onClick={checkEligibility}
                                    disabled={!identity || !ethers.isAddress(identity)}
                                    className="primary-button w-full"
                                >
                                    Check Score & Eligibility
                                </button>
                            </motion.div>
                        )}
                        {step === 'checking' && (
                            <motion.div
                                key="checking"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="py-12"
                            >
                                <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                                <p className="text-indigo-300">Analyzing on-chain reputation...</p>
                            </motion.div>
                        )}
                        {step === 'result' && result && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <div className={`p-4 rounded-xl border ${result.eligible ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                    <div className="text-sm text-gray-400 uppercase tracking-widest mb-1">Nomis Score</div>
                                    <div className={`text-5xl font-bold ${result.eligible ? 'text-green-400' : 'text-red-400'}`}>
                                        {result.score}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        {result.eligible ? 'Eligibility Confirmed' : 'Score too low for claim'}
                                    </div>
                                </div>
                                {result.eligible && (
                                    <div>
                                        <button onClick={addClaimToIdentity} className="primary-button w-full mb-4">
                                            Add Claim to OnChainID
                                        </button>
                                        {txStatus && (
                                            <p className="text-xs text-gray-400 break-all p-2 bg-black/30 rounded">
                                                {txStatus}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <button onClick={() => setStep('input')} className="text-sm text-gray-500 hover:text-white transition-colors">
                                    Check another ID
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </main>
    );
}
