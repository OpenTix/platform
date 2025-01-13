import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import AppRouter from './router';
import { MagicProvider } from '@platform/auth';

const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement
);
root.render(
	<StrictMode>
		<MagicProvider>
			<AppRouter />
		</MagicProvider>
	</StrictMode>
);
