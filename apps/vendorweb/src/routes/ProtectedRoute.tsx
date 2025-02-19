import { useIsLoggedIn } from '@dynamic-labs/sdk-react-core';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const isLoggedIn = useIsLoggedIn();
	return isLoggedIn ? children : null;
}

export default ProtectedRoute;
