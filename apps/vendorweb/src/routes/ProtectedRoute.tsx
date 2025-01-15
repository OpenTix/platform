import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useMagic } from '@platform/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const magic = useMagic();
	const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

	useEffect(() => {
		magic.user
			.isLoggedIn()
			.then((isLoggedIn) => {
				setIsLoggedIn(isLoggedIn);
			})
			.catch((error) => {
				console.error(error);
				setIsLoggedIn(false);
			});
	}, [magic]);

	if (isLoggedIn === null) {
		return <div>Loading...</div>;
	}

	if (!isLoggedIn) {
		return <Navigate to="/" />;
	}

	return children;
}

export default ProtectedRoute;
