import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { useMagic } from '@platform/auth';
import { ErrorPage } from '@platform/ui';
import ConditionalLayout from './routes/ConditionalLayout';
import ConditionalRoot from './routes/ConditionalRoot';
import ProtectedRoute from './routes/ProtectedRoute';
import ExamplePage1 from './views/ExamplePage1';

// This renders <App /> with child components rendered in the <Outlet /> component in the App component
const router = createBrowserRouter([
	{
		path: '/',
		element: <ConditionalLayout />,
		errorElement: <ErrorPage fatal={true} />, // this won't render the navbar
		children: [
			{
				index: true,
				element: <ConditionalRoot />,
				ErrorBoundary: ErrorPage
			},
			{
				path: 'example1',
				element: (
					<ProtectedRoute>
						<ExamplePage1 />
					</ProtectedRoute>
				),
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
