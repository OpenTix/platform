import { Outlet } from 'react-router-dom';
import Navigation from './components/Navigation';
import { MagicProvider } from './auth/magic';

export default function App() {
	return (
		<MagicProvider>
			<Navigation />
			<Outlet />
		</MagicProvider>
	);
}
