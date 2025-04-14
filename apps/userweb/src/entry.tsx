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

if (isMobile) {
	root.render(
		<StrictMode>
			<ViewingOnMobile />
		</StrictMode>
	);
} else {
	root.render(
		<StrictMode>
			<ThemeProvider attribute={'class'} defaultTheme="system">
				<Theme accentColor={'purple'}>
					<AppRouter />
				</Theme>
			</ThemeProvider>
		</StrictMode>
	);
}
