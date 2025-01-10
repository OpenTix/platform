import React, { createContext, useContext, useMemo } from 'react';
import { Magic } from 'magic-sdk';
import { useNavigate } from 'react-router-dom';

const MagicContext = createContext<Magic | null>(null);

const publicKey = process.env.NX_PUBLIC_MAGIC_PUBLISHABLE_KEY;
if (!publicKey) {
	throw new Error('Missing Magic public key');
}
const customNodeOptions = {
	rpcUrl: 'https://goerli.optimism.io',
	chainId: 420,
};

export const MagicProvider = ({ children }: { children: React.ReactNode }) => {
	const navigate = useNavigate();
	const magic = useMemo(() => {
		return new Magic(publicKey, {
			network: customNodeOptions,
			useStorageCache: true,
		});
	}, []);

	// This is only called if useStorageCache is set to true
	magic.user.onUserLoggedOut(() => {
		navigate('/');
	});

	return (
		<MagicContext.Provider value={magic}>{children}</MagicContext.Provider>
	);
};

export const useMagic = () => {
	const context = useContext(MagicContext);
	if (!context) {
		throw new Error('useMagic must be used within a MagicProvider');
	}
	return context;
};
