import { Outlet } from 'react-router-dom';
import Navigation from './components/Navigation';
import { MagicProvider } from '@platform/auth';

// This allows us to render the navbar on every page of our app.
// it also gives a place to render all providers after the routerprovider
export default function App() {
	return (
		<MagicProvider>
			<Navigation />
			<Outlet />
		</MagicProvider>
	);
}
