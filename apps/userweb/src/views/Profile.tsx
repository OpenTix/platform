import { useDynamicContext, useIsLoggedIn } from '@dynamic-labs/sdk-react-core';

export default function Profile() {
	const isLoggedIn = useIsLoggedIn();
	const { primaryWallet } = useDynamicContext();

	return (
		<>
			<h1>Profile</h1>
			{isLoggedIn ? (
				<>
					<p>Welcome to your profile page!</p>

					{primaryWallet ? (
						<>
							<p>{primaryWallet.id}</p>
							<p>{primaryWallet.key}</p>
							<p>{primaryWallet.address}</p>
							<p>{primaryWallet.chain}</p>
						</>
					) : (
						<p>Trouble Loading Primary Wallet.</p>
					)}
				</>
			) : (
				<p>You are not logged in.</p>
			)}
		</>
	);
}
