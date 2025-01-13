import React, { createContext, useContext, useMemo } from 'react';
import { Magic } from 'magic-sdk';

const MagicContext = createContext<Magic | null>(null);

const publicKey = process.env.NX_PUBLIC_MAGIC_PUBLISHABLE_KEY;
if (!publicKey) {
	throw new Error('Missing Magic public key');
}
const customNodeOptions = {
	rpcUrl: 'https://goerli.optimism.io',
	chainId: 420,
};

// MagicProvider component to provide the Magic instance to the rest of the app
export const MagicProvider = ({ children }: { children: React.ReactNode }) => {
	// Create the Magic instance using useMemo to ensure it's only created once
	const magic = useMemo(() => {
		return new Magic(publicKey, {
			network: customNodeOptions,
			useStorageCache: true,
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
