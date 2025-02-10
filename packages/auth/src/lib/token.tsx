import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	ReactNode
} from 'react';
import { useMagic } from './magic';

const TOKEN_VALIDITY_DURATION = 14 * 60 * 1000; // 15 minutes - 1 minute

type TokenContextType = {
	token: string | null;
	tokenCreatedAt: number | null;
	storeToken: (token: string) => void;
	getToken: () => Promise<string>;
};

const TokenContext = createContext<TokenContextType | undefined>(undefined);

type TokenProviderProps = {
	children: ReactNode;
};

export const TokenProvider = ({ children }: TokenProviderProps) => {
	const [token, setToken] = useState<string | null>(null);
	const [tokenCreatedAt, setTokenCreatedAt] = useState<number | null>(null);

	const magic = useMagic();

	const storeToken = useCallback((newToken: string) => {
		setToken(newToken);
		setTokenCreatedAt(Date.now());
	}, []);

	const regenerateToken = async (): Promise<string> => {
		const newToken = await magic.user.getIdToken();
		storeToken(newToken);
		return newToken;
	};

	const getToken = useCallback(async (): Promise<string> => {
		if (
			token &&
			tokenCreatedAt &&
			Date.now() - tokenCreatedAt < TOKEN_VALIDITY_DURATION
		) {
			return token;
		}
		return regenerateToken();
	}, [token, tokenCreatedAt, regenerateToken]);

	return (
		<TokenContext.Provider
			value={{ token, tokenCreatedAt, storeToken, getToken }}
		>
			{children}
		</TokenContext.Provider>
	);
};

export const useToken = (): TokenContextType => {
	const context = useContext(TokenContext);
	if (!context) {
		throw new Error('useToken must be used within a TokenProvider');
	}
	return context;
};
