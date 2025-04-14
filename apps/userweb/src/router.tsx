import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import {
	DynamicContextProps,
	DynamicContextProvider
} from '@dynamic-labs/sdk-react-core';
import { ThemeSetting } from '@dynamic-labs/sdk-react-core/src/lib/context/ThemeContext';
import { useEffect, useState } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ErrorPage } from '@platform/ui';
import App from './App';
import EventDetailsPage from './views/EventDetailsPage';
import EventSearchPage from './views/EventSearchPage';
import Home from './views/Home';
import Profile from './views/Profile';
import PurchaseUserTicket from './views/PurchaseUserTicket';

const dynamicSettings: DynamicContextProps['settings'] = {
	environmentId: process.env.NX_PUBLIC_DYNAMIC_ENVIRONMENT_ID ?? '',
	walletConnectors: [EthereumWalletConnectors],
	initialAuthenticationMode: 'connect-and-sign'
};

// This renders <App /> with child components rendered in the <Outlet /> component in the App component
const router = createBrowserRouter([
	{
		path: '/',
		element: <App />,
		errorElement: <ErrorPage fatal={true} />, // this won't render the navbar
		children: [
			{
				path: '/',
				element: <Home />,
				ErrorBoundary: ErrorPage
			},
			{
				path: '/profile',
				element: <Profile />,
				ErrorBoundary: ErrorPage
			},
			{
				path: 'event/:id',
				element: <EventDetailsPage />,
				ErrorBoundary: ErrorPage
			},
			{
				path: '/eventSearch',
				element: <EventSearchPage />,
				ErrorBoundary: ErrorPage
			},
			{
				path: '/buyUserTicket',
				element: <PurchaseUserTicket />,
				ErrorBoundary: ErrorPage
			},
			{
				path: '*',
				element: <ErrorPage is404={true} />
			}
		]
	}
]);

const AppRouter = () => {
	const [theme, setTheme] = useState<string>('auto');
	useEffect(() => {
		window.addEventListener('local-storage', () => {
			const tmp = localStorage.getItem('theme');
			setTheme(tmp === 'system' ? 'auto' : (tmp ?? 'auto'));
		});
	}, [setTheme]);

	return (
		<DynamicContextProvider
			theme={theme as ThemeSetting}
			settings={dynamicSettings}
		>
			<RouterProvider router={router} />
		</DynamicContextProvider>
	);
};

export default AppRouter;
