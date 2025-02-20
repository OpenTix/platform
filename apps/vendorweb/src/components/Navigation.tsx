import { DynamicWidget, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Box, Flex, Heading, Skeleton } from '@radix-ui/themes';
import { get } from 'http';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { NavLink, Navbar } from '@platform/ui';

const BalanceHeader = styled.div`
	color: green;
	font-size: 1.5em;
`;

export default function Navigation() {
	//const { setShowAuthFlow } = useDynamicContext();
	//if we want to change the login button, have a button call this with 'true'
	//to show the modal. this includes dynamic's profile modal post-login
	const [balance, setBalance] = useState<number | null | undefined>(
		undefined
	);
	const { primaryWallet } = useDynamicContext();

	const getUserBalance = async () => {
		const bal = await primaryWallet?.getBalance();
		if (bal) {
			await fetch('https://api.coinbase.com/v2/prices/POL-USD/buy')
				.then((response) => response.json())
				.then((data) => {
					const rate = data.data.amount;
					setBalance(Number(bal) * rate);
				});
		} else {
			setBalance(null);
		}
	};
	useEffect(() => {
		getUserBalance();
	}, []);

	return (
		<Navbar>
			<Box>
				<NavLink to="/">Home</NavLink>
				<NavLink to="/profile">Profile</NavLink>
			</Box>
			<Flex gap={'2'}>
				{balance === undefined ? (
					<Skeleton>
						<Box>
							<BalanceHeader>Balance</BalanceHeader>
						</Box>
					</Skeleton>
				) : balance === null ? (
					<Box></Box>
				) : (
					<Box>
						<BalanceHeader>${balance.toFixed(2)}</BalanceHeader>
					</Box>
				)}
				<DynamicWidget />
			</Flex>
		</Navbar>
	);
}
