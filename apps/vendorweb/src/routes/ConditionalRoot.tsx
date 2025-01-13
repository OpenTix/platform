import { useEffect, useState } from 'react';
import { useMagic } from '@platform/auth';
import Login from '../views/Login';
import Home from '../views/Home';

const ConditionalRoot = () => {
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

	return isLoggedIn ? <Home /> : <Login />;
};

export default ConditionalRoot;
