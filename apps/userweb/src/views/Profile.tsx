import { useEffect, useState } from 'react';
import { useMagic } from '@platform/auth';
import { MagicUserMetadata } from 'magic-sdk';
import { BeatLoader } from 'react-spinners';
import { VersionTag } from '@platform/ui';

export default function Profile() {
	const magic = useMagic();
	const [userMetadata, setUserMetadata] = useState<MagicUserMetadata>();
	const [isLoading, setIsLoading] = useState(false);

	// Retrieve some basic user data
	const getUserMetadata = async () => {
		setIsLoading(true);
		magic.user
			.isLoggedIn()
			.then(async (isLoggedIn) => {
				if (isLoggedIn) {
					const metadata = await magic.user.getInfo();
					setUserMetadata(metadata);
				}
			})
			.then(() => setIsLoading(false))
			.catch((error) => {
				console.error(error);
				setIsLoading(false);
			});
	};

	// Call on initial render
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
