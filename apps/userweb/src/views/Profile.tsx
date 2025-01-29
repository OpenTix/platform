import { MagicUserMetadata } from 'magic-sdk';
import { useEffect, useState } from 'react';
import { BeatLoader } from 'react-spinners';
import { useMagic } from '@platform/auth';

export default function Profile() {
	const magic = useMagic();
	const [userMetadata, setUserMetadata] = useState<MagicUserMetadata>();
	const [isLoading, setIsLoading] = useState(false);

	const generateIdToken = async () => {
		const token = await magic.user.getIdToken();
		console.log(token);
	};

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
			<h1>Profile</h1>
			<p>Welcome to your profile page!</p>
			<BeatLoader color="#000" loading={isLoading} />

			{!isLoading &&
				(userMetadata ? (
					<>
						<p>Authenticated user: {userMetadata.email}</p>
						<p>Wallet Address: {userMetadata.publicAddress}</p>
						<button onClick={generateIdToken}>
							Generate Token
						</button>
					</>
				) : (
					<p>No User is Logged in.</p>
				))}
		</>
	);
}
