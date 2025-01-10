import { useEffect, useState } from 'react';
import { useMagic } from '../auth/magic';
import { MagicUserMetadata } from 'magic-sdk';
import { BeatLoader } from 'react-spinners';
import { VersionTag } from '@platform/ui';

export default function Profile() {
	const magic = useMagic();
	const [userMetadata, setUserMetadata] = useState<MagicUserMetadata>();
	const [isLoading, setIsLoading] = useState(false);

	const getUserMetadata = async () => {
		setIsLoading(true);
		try {
			const isLoggedIn = await magic.user.isLoggedIn();
			if (isLoggedIn) {
				const metadata = await magic.user.getInfo();
				setUserMetadata(metadata);
			}
		} catch (error) {
			console.error(error);
		}
		setIsLoading(false);
	};

	useEffect(() => {
		getUserMetadata();
	}, []);

	return (
		<>
			<div>
				<h1>Profile</h1>
				<p>Welcome to your profile page!</p>
				<BeatLoader color="#000" loading={isLoading} />

				{!isLoading &&
					(userMetadata ? (
						<>
							<p>Authenticated user: {userMetadata.email}</p>
							<p>Wallet Address: {userMetadata.publicAddress}</p>
						</>
					) : (
						<p>No User is Logged in.</p>
					))}
			</div>
			<VersionTag />
		</>
	);
}
