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
		errorElement: <ErrorPage fatal={true} />, // this won't render the navbar
		children: [
			{
				path: '/',
				element: <Home />,
				ErrorBoundary: ErrorPage,
			},
			{
				path: '/profile',
				element: <Profile />,
				ErrorBoundary: ErrorPage,
			},
			{
				path: '*',
				element: <ErrorPage is404={true} />,
			},
		],
	},
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
