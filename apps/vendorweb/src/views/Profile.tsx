import {
	CopyIcon,
	getAuthToken,
	useDynamicContext,
	useEmbeddedReveal,
	useEmbeddedWallet,
	useOpenFundingOptions,
	useSendBalance
} from '@dynamic-labs/sdk-react-core';
import {
	Badge,
	Box,
	Button,
	Callout,
	Card,
	Dialog,
	Flex,
	Heading,
	Separator,
	Text,
	TextField
} from '@radix-ui/themes';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

//70/30 left right column split
const LeftColumn = styled.div`
	width: 70%;
	display: flex;
	flex-direction: column;
	align-items: center;
`;
const RightColumn = styled.div`
	width: 30%;
	display: flex;
	flex-direction: column;
	align-items: center;
`;
const Balance = styled.div`
	color: green;
	font-size: 1.5em;
	font-weight: bold;
`;
const CalloutIconPointer = styled(Callout.Icon)`
	cursor: pointer;
`;
const ActionsText = styled(Text)`
	cursor: pointer;
	transition: background-color 0.3s;
	border-radius: 4px;
	padding: 5px;
	&:hover {
		background-color: #f0f0f0;
	}
`;

export default function Profile() {
	const { primaryWallet, handleLogOut } = useDynamicContext();
	const { userHasEmbeddedWallet } = useEmbeddedWallet();
	const { open } = useSendBalance();
	const { initExportProcess } = useEmbeddedReveal();
	const { openFundingOptions } = useOpenFundingOptions();
	const BASEURL = process.env.NX_PUBLIC_API_BASEURL;
	const [balance, setBalance] = useState<number | null | undefined>(
		undefined
	);
	const [isWeb2User, setIsWeb2User] = useState<boolean>(false);
	const [vendorName, setVendorName] = useState<string>('');

	const getUserBalance = async () => {
		const bal = await primaryWallet?.getBalance();
		if (bal) {
			setBalance(Number(bal));
		} else {
			setBalance(null);
		}
	};
	const handleAddressCopy = () => {
		if (primaryWallet?.address)
			navigator.clipboard.writeText(primaryWallet?.address);
	};
	const handleSendbalance = async () => {
		try {
			await open();
		} catch (error) {
			console.error(error);
		}
	};
	const getVendorName = async () => {
		const tk = getAuthToken();
		await fetch(BASEURL + '/vendor/id', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${tk}`
			}
		}).then((res) => {
			if (res.ok && res.status === 200) {
				res.json().then((data) => {
					setVendorName(data.Name);
				});
			}
		});
	};
	const handleUpdateNameSubmit = async (
		e: React.FormEvent<HTMLFormElement>
	) => {
		e.preventDefault();
		console.log(e);
		console.log(e.target);
	};

	useEffect(() => {
		getUserBalance();
		setIsWeb2User(userHasEmbeddedWallet());
		getVendorName();
	}, []);

	return (
		<>
			<Box py={'5'}>
				<Heading>Profile</Heading>
			</Box>
			<Flex gap="5">
				<LeftColumn>
					<Box width="100%">
						<Flex gap="3" direction={'column'}>
							<Card>
								<Flex gap="3" direction={'column'}>
									<Heading size="5">{vendorName}</Heading>
									<Callout.Root variant="soft" color="gray">
										<CalloutIconPointer
											onClick={handleAddressCopy}
										>
											<CopyIcon />
										</CalloutIconPointer>
										<Callout.Text size="3">
											{primaryWallet?.address}
										</Callout.Text>
									</Callout.Root>
									<Text weight="light" size="1">
										This is your wallet address. It holds
										money and your event tickets, and can be
										used to send or receive both.
									</Text>
								</Flex>
							</Card>
							<Card>
								<Flex gap="3" direction={'column'}>
									<Heading size="5">Funding</Heading>
									<Flex align="center" gap="2">
										<Text weight="light">Exchange</Text>
										<Badge color="green">Easiest</Badge>
									</Flex>
									<Text>
										You can deposit money in multiple ways.
										The easiest is to use an exchange
									</Text>
									<ol
										style={{
											paddingLeft: '1.5rem',
											margin: 0
										}}
									>
										<li>
											<Text>
												Buy USDC from Coinbase or
												another exchange.
											</Text>
										</li>
										<li>
											<Text>
												Send USDC to your wallet address
												above.
											</Text>
										</li>
									</ol>
									<Separator size="4" />
									<Text weight="light">Other Options</Text>
									<ul
										style={{
											paddingLeft: '1.5rem',
											margin: 0
										}}
									>
										<li>
											<Text>
												Buy directly using a wallet like
												Metamask.
											</Text>
										</li>
									</ul>
								</Flex>
							</Card>
						</Flex>
					</Box>
				</LeftColumn>
				<RightColumn>
					<Box width={'100%'}>
						<Flex gap="3" direction={'column'}>
							<Card>
								<Flex gap="3" direction={'column'}>
									<Heading size="5">Balance</Heading>
									<Balance>${balance?.toFixed(2)}</Balance>
								</Flex>
							</Card>
							<Card>
								<Flex gap="3" direction={'column'}>
									<Heading size="5">Actions</Heading>
									<Dialog.Root>
										<Dialog.Trigger>
											<ActionsText>
												Change Name
											</ActionsText>
										</Dialog.Trigger>

										<Dialog.Content maxWidth="450px">
											<Dialog.Title>
												Update Name
											</Dialog.Title>
											<Dialog.Description size="2" mb="4">
												Change your vendor name. This
												will change how you appear to
												users on the site.
											</Dialog.Description>
											<form
												onSubmit={
													handleUpdateNameSubmit
												}
											>
												<Flex
													direction="column"
													gap="3"
												>
													<label>
														<Text
															as="div"
															size="2"
															mb="1"
															weight="bold"
														>
															Name
														</Text>
														<TextField.Root placeholder="Organization Name" />
													</label>
												</Flex>

												<Flex
													gap="3"
													mt="4"
													justify="end"
												>
													<Dialog.Close>
														<Button
															variant="soft"
															color="gray"
														>
															Cancel
														</Button>
													</Dialog.Close>
													<Dialog.Close>
														<Button type="submit">
															Save
														</Button>
													</Dialog.Close>
												</Flex>
											</form>
										</Dialog.Content>
									</Dialog.Root>
									<ActionsText onClick={handleSendbalance}>
										Send Money
									</ActionsText>
									<ActionsText onClick={openFundingOptions}>
										Deposit Money
									</ActionsText>
									<ActionsText onClick={() => handleLogOut()}>
										Logout
									</ActionsText>
									{isWeb2User && (
										<>
											<ActionsText color="red">
												Unlink Account
											</ActionsText>
											<ActionsText
												color="red"
												onClick={() =>
													initExportProcess()
												}
											>
												Export Private Key
											</ActionsText>
										</>
									)}
								</Flex>
							</Card>
						</Flex>
					</Box>
				</RightColumn>
			</Flex>
		</>
	);
}
