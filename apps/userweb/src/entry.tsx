import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import {
	DynamicContextProps,
	DynamicContextProvider
} from '@dynamic-labs/sdk-react-core';
import { Theme } from '@radix-ui/themes';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import './base.css';
import AppRouter from './router';

const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement
);

if (!process.env.NX_PUBLIC_DYNAMIC_ENVIRONMENT_ID) {
	throw new Error('Missing Dynamic Environment ID');
}

const dynamicSettings: DynamicContextProps['settings'] = {
	environmentId: process.env.NX_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
	walletConnectors: [EthereumWalletConnectors],
	initialAuthenticationMode: 'connect-and-sign'
};
root.render(
	<StrictMode>
		<Theme>
			<DynamicContextProvider settings={dynamicSettings}>
				<AppRouter />
			</DynamicContextProvider>
		</Theme>
	</StrictMode>
);
