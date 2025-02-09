import { Theme } from '@radix-ui/themes';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { MagicProvider } from '@platform/auth';
import './base.css';
import AppRouter from './router';

const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement
);
root.render(
	<StrictMode>
		<Theme accentColor='purple'>
			<MagicProvider>
				<AppRouter />
			</MagicProvider>
		</Theme>
	</StrictMode>
);
