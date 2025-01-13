import { useEffect, useState } from 'react';
import { useMagic } from '@platform/auth';
import AppLayout from './AppLayout';
import { Outlet } from 'react-router-dom';

function ConditionalLayout() {
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

	return isLoggedIn ? <AppLayout /> : <Outlet />;
}

export default ConditionalLayout;
