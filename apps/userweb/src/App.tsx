import { Outlet } from 'react-router-dom';
import Navigation from './components/Navigation';

// This allows us to render the navbar on every page of our app.
// it also gives a place to render all providers after the routerprovider
export default function App() {
	return (
		<>
			<Navigation />
			<Outlet />
		</>
	);
}
