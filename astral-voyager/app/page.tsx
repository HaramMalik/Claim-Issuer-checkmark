"use client";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
declare global {
    interface Window {
        ethereum: any;
    }
}
// Icons (SVG)
const Icons = {
    Identity: () => <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>,
    Claims: () => <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Wallet: () => <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
};
export default function Page() {
    const [activeTab, setActiveTab] = useState('claims');
    const [wallet, setWallet] = useState<string | null>(null);
    const [identity, setIdentity] = useState<string>('');
    // Nomis State
    const [loading, setLoading] = useState(false);
    const [scoreData, setScoreData] = useState<any>(null);
    const [txStatus, setTxStatus] = useState<string>('');
    useEffect(() => {
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.request({ method: 'eth_accounts' })
                .then((accs: string[]) => { if (accs.length) setWallet(accs[0]); });
        }
    }, []);
    const connectWallet = async () => {
        if (!window.ethereum) return;
        try {
            // Force Polygon Amoy
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x13882' }],
                });
            } catch (e: any) {
                if (e.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x13882',
                            chainName: 'Polygon Amoy',
                            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                            rpcUrls: ['https://rpc-amoy.polygon.technology/'],
                        }]
                    });
                }
            }
            const p = new ethers.BrowserProvider(window.ethereum);
            const accs = await p.send("eth_requestAccounts", []);
            setWallet(accs[0]);
        } catch (e) { console.error(e); }
    };
    const checkNomis = async () => {
        if (!wallet || !identity) return;
        setLoading(true);
        try {
            const res = await fetch('/api/issue-claim', {
                method: 'POST', body: JSON.stringify({ userWalletAddress: wallet, identityAddress: identity })
            });
            setScoreData(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };
    const addClaim = async () => {
        if (!scoreData?.claim) return;
        try {
            setTxStatus('Sign in Wallet...');
            const p = new ethers.BrowserProvider(window.ethereum);
            const s = await p.getSigner();
            const abi = ["function addClaim(uint256,uint256,address,bytes,bytes,string)", "function execute(address,uint256,bytes)"];
            const c = new ethers.Contract(identity, abi, s);
            const iface = new ethers.Interface(abi);
            const { topic, scheme, issuer, signature, data, uri } = scoreData.claim;
            const calldata = iface.encodeFunctionData("addClaim", [topic, scheme, issuer, signature, data, uri]);
            const tx = await c.execute(identity, 0, calldata);
            setTxStatus('Transaction Sent!');
            await tx.wait();
            setTxStatus('Success! Claim Added.');
        } catch (e: any) { setTxStatus(e.reason || e.message); }
    };
    return (
        <div className="layout-wrapper">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold tracking-tight text-white">ONCHAINID <span className="text-blue-500 text-xs align-top">MVP</span></h2>
                </div>
                <nav className="flex-1 py-4">
                    <div className={`nav-item ${activeTab === 'identity' ? 'active' : ''}`} onClick={() => setActiveTab('identity')}>
                        <Icons.Identity /> Identity
                    </div>
                    <div className={`nav-item ${activeTab === 'claims' ? 'active' : ''}`} onClick={() => setActiveTab('claims')}>
                        <Icons.Claims /> Claims
                    </div>
                </nav>
                <div className="p-4 text-xs text-slate-500">
                    Nomis Issuer v1.0.0
                </div>
            </aside>
            {/* Main Content */}
            <div className="main-content">
                {/* Topbar */}
                <header className="topbar">
                    {!wallet ? (
                        <button onClick={connectWallet} className="btn btn-primary flex items-center">
                            <Icons.Wallet /> Connect Wallet
                        </button>
                    ) : (
                        <div className="flex items-center text-sm font-medium text-slate-300 bg-slate-800 py-2 px-4 rounded-full border border-slate-700">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            {wallet.slice(0, 6)}...{wallet.slice(-4)}
                        </div>
                    )}
                </header>
                {/* Content */}
                <div className="content-area">
                    {/* Identity Context Bar */}
                    <div className="mb-8 flex items-end justify-between">
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Managing Identity</label>
                            <input
                                className="input-field font-mono text-lg"
                                placeholder="Enter OnChainID Contract Address (0x...)"
                                value={identity}
                                onChange={e => setIdentity(e.target.value)}
                                style={{ width: '450px' }}
                            />
                        </div>
                        {identity && ethers.isAddress(identity) && (
                            <div className="badge badge-green">Valid Contract</div>
                        )}
                    </div>
                    {activeTab === 'claims' && (
                        <div className="space-y-6">
                            {/* Existing Claims (Mock) */}
                            <div className="card">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-semibold text-white">Your Claims</h3>
                                    <span className="badge badge-gray">0 Claims Found</span>
                                </div>
                                <div className="min-h-[100px] flex items-center justify-center text-slate-500 text-sm">
                                    No claims found on this Identity.
                                </div>
                            </div>
                            {/* ACTION: Nomis Marketplace */}
                            <div className="card border-blue-500/30">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            Nomis Reputation Pass
                                            <span className="badge badge-blue">Recommended</span>
                                        </h3>
                                        <p className="text-slate-400 text-sm mt-1">Get verified based on your on-chain activity Nomis Score.</p>
                                    </div>
                                    {/* Nomis Logo Placeholder */}
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white">N</div>
                                </div>
                                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                                    {!scoreData ? (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-400">Requirements: Score {'>'} 40</span>
                                            <button
                                                onClick={checkNomis}
                                                disabled={!wallet || !identity || loading}
                                                className="btn btn-primary"
                                            >
                                                {loading ? 'Verifying...' : 'Check Qualification'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="text-3xl font-bold text-white">{scoreData.score}</div>
                                                <div className="text-sm">
                                                    {scoreData.eligible ? (
                                                        <span className="text-green-500 font-medium">Qualified</span>
                                                    ) : (
                                                        <span className="text-red-500">Not Qualified</span>
                                                    )}
                                                </div>
                                            </div>
                                            {scoreData.eligible && (
                                                <div className="flex items-center justify-between border-t border-slate-700 pt-4">
                                                    <div className="text-xs font-mono text-slate-500">
                                                        Topic: {scoreData.claim?.topic.slice(0, 10)}...
                                                    </div>
                                                    <div className="flex gap-2 items-center">
                                                        {txStatus && <span className="text-xs text-blue-400">{txStatus}</span>}
                                                        <button onClick={addClaim} className="btn btn-primary">
                                                            Mint Claim
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'identity' && (
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-4">Identity Information</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="text-slate-500 block mb-1">Contract Address</label>
                                    <div className="font-mono text-white">{identity || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-slate-500 block mb-1">Owner (Management Key)</label>
                                    <div className="font-mono text-white">{wallet || '-'}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
