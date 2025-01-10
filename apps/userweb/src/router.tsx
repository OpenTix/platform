import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Home from './views/Home';
import ErrorPage from './error/ErrorPage';
import Profile from './views/Profile';
import App from './App';

// This renders <App /> with child components rendered in the <Outlet /> component in the App component
const router = createBrowserRouter([
	{
		path: '/',
		element: <App />,
		ErrorBoundary: ErrorPage,
		children: [
			{
				path: '/',
				element: <Home />,
			},
			{
				path: '/profile',
				element: <Profile />,
			},
		],
	},
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
