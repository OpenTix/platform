import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ErrorPage } from '@platform/ui';
import ConditionalRoot from './routes/ConditionalRoot';
import Details from './views/Details';
import Home from './views/Home';
import Profile from './views/Profile';

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
	return <RouterProvider router={router} />;
};

export default AppRouter;
