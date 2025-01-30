import { Magic } from 'magic-sdk';
import React, { createContext, useContext, useMemo } from 'react';

const MagicContext = createContext<Magic | null>(null);

const publicKey = process.env.NX_PUBLIC_MAGIC_PUBLISHABLE_KEY;
if (!publicKey) {
	throw new Error('Missing Magic public key');
}
const rpcUrl = process.env.NX_PUBLIC_RPC_URL;
if (!rpcUrl) {
	throw new Error('Missing RPC URL');
}
const chainId = process.env.NX_PUBLIC_CHAIN_ID;
if (!chainId) {
	throw new Error('Missing Chain ID');
}
const customNodeOptions = {
	rpcUrl: rpcUrl,
	chainId: parseInt(chainId)
};

// MagicProvider component to provide the Magic instance to the rest of the app
export const MagicProvider = ({ children }: { children: React.ReactNode }) => {
	// Create the Magic instance using useMemo to ensure it's only created once
	const magic = useMemo(() => {
		return new Magic(publicKey, {
			network: customNodeOptions,
			useStorageCache: true
		});
	}, []);

	return (
		<MagicContext.Provider value={magic}>{children}</MagicContext.Provider>
	);
};

// Custom hook to use the Magic instance
export const useMagic = () => {
	const context = useContext(MagicContext);
	if (!context) {
		throw new Error('useMagic must be used within a MagicProvider');
	}
	return context;
};
