import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { useMagic } from '@platform/auth';
import { ErrorPage } from '@platform/ui';
import ConditionalRoot from './routes/ConditionalRoot';
import ExamplePage1 from './views/ExamplePage1';
import Home from './views/Home';

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
				path: 'example1',
				element: <ExamplePage1 />,
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
	const magic = useMagic();
	magic.user.onUserLoggedOut(() => {
		router.navigate(0);
	});

	return <RouterProvider router={router} />;
};

export default AppRouter;
