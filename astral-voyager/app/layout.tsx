import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Nomis Claim Issuer',
    description: 'Issue OnChainID claims based on your Nomis Score',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
