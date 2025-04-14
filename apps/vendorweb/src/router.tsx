import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import {
	DynamicContextProps,
	DynamicContextProvider
} from '@dynamic-labs/sdk-react-core';
import { ThemeSetting } from '@dynamic-labs/sdk-react-core/src/lib/context/ThemeContext';
import { MantineColorScheme, MantineProvider } from '@mantine/core';
import { useEffect, useState } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ErrorPage } from '@platform/ui';
import ConditionalRoot from './routes/ConditionalRoot';
import Details from './views/Details';
import Home from './views/Home';
import Profile from './views/Profile';

const dynamicSettings: DynamicContextProps['settings'] = {
	environmentId: process.env.NX_PUBLIC_DYNAMIC_ENVIRONMENT_ID ?? '',
	walletConnectors: [EthereumWalletConnectors],
	initialAuthenticationMode: 'connect-and-sign'
};

// All child routes are protected by the login and id check in ConditionalRoot
const router = createBrowserRouter([
	{
		path: '/',
		element: <ConditionalRoot />,
		errorElement: <ErrorPage fatal={true} />, // this won't render the navbar
		children: [
			{
				index: true,
				element: <Home />,
				ErrorBoundary: ErrorPage
			},
			{
				path: 'profile',
				element: <Profile />,
				ErrorBoundary: ErrorPage
			},
			{
				path: 'venue/:id',
				element: <Details typestring="venue" />,
				ErrorBoundary: ErrorPage
			},
			{
				path: 'event/:id',
				element: <Details typestring="event" />,
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
		<MantineProvider defaultColorScheme={theme as MantineColorScheme}>
			<DynamicContextProvider
				theme={theme as ThemeSetting}
				settings={dynamicSettings}
			>
				<RouterProvider router={router} />
			</DynamicContextProvider>
		</MantineProvider>
	);
};

export default AppRouter;
