import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import {
	DynamicContextProps,
	DynamicContextProvider
} from '@dynamic-labs/sdk-react-core';
import { ThemeSetting } from '@dynamic-labs/sdk-react-core/src/lib/context/ThemeContext';
import { Theme } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';
import { StrictMode } from 'react';
import { isMobile } from 'react-device-detect';
import * as ReactDOM from 'react-dom/client';
import { ViewingOnMobile } from '@platform/ui';
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

if (isMobile) {
	root.render(
		<StrictMode>
			<ViewingOnMobile />
		</StrictMode>
	);
} else {
	let theme = localStorage.getItem('theme');
	theme = theme === 'system' ? 'auto' : (theme ?? 'auto');

	root.render(
		<StrictMode>
			<ThemeProvider
				attribute={['class', 'data-dynamic-theme']}
				defaultTheme="system"
			>
				<Theme accentColor={'purple'}>
					<DynamicContextProvider
						theme={theme as ThemeSetting}
						settings={dynamicSettings}
					>
						<AppRouter />
					</DynamicContextProvider>
				</Theme>
			</ThemeProvider>
		</StrictMode>
	);
}
