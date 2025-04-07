import { isEthereumWallet } from '@dynamic-labs/ethereum';
import {
	CopyIcon,
	getAuthToken,
	useDynamicContext,
	useEmbeddedReveal,
	useEmbeddedWallet,
	useOpenFundingOptions,
	useSendBalance,
	useIsLoggedIn
} from '@dynamic-labs/sdk-react-core';
import { ContractAddress, ContractABI } from '@platform/blockchain';
import { UserEventDetailsResponse } from '@platform/types';
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
	Skeleton,
	Text,
	Container
	// TextField
} from '@radix-ui/themes';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { TicketCard } from '../components/TicketCard';

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
const USDBalance = styled.div`
	color: green;
	font-size: 1.5em;
	font-weight: bold;
`;
const TokenBalance = styled.div`
	color: black;
	font-size: 1.5em;
	font-weight: light;
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

interface TicketInfo {
	ticketid: bigint;
	data: UserEventDetailsResponse;
}

export default function Profile() {
	const { primaryWallet, handleLogOut, handleUnlinkWallet } =
		useDynamicContext();
	const { userHasEmbeddedWallet, revealWalletKey } = useEmbeddedWallet();
	const { open } = useSendBalance();
	const { initExportProcess } = useEmbeddedReveal();
	const { openFundingOptions } = useOpenFundingOptions();
	const BASEURL = process.env.NX_PUBLIC_API_BASEURL;
	const [balance, setBalance] = useState<number | null | undefined>(
		undefined
	);
	const [usdBalance, setUsdBalance] = useState<number | null | undefined>(
		undefined
	);
	const [isWeb2User, setIsWeb2User] = useState<boolean>(false);
	const [ticketData, setTicketData] = useState<
		TicketInfo[] | null | undefined
	>(undefined);
	const isLoggedIn = useIsLoggedIn();

	const getUserBalance = async () => {
		const bal = await primaryWallet?.getBalance();
		if (bal) {
			setBalance(Number(bal));
			await fetch('https://api.coinbase.com/v2/prices/POL-USD/buy')
				.then((response) => response.json())
				.then((data) => {
					const rate = data.data.amount;
					setUsdBalance(Number(bal) * rate);
				})
				.catch((error) => {
					console.error(error);
					setUsdBalance(null);
				});
		} else {
			setBalance(null);
		}
	};
	const handleAddressCopy = () => {
		if (primaryWallet?.address)
			navigator.clipboard.writeText(primaryWallet.address);
	};
	const handleSendbalance = async () => {
		try {
			await open();
		} catch (error) {
			console.error(error);
		}
	};

	async function getNFTsInWallet() {
		const token = getAuthToken();
		const url = `${process.env.NX_PUBLIC_API_BASEURL}/oklink?wallet=${primaryWallet?.address}&tokenContractAddress=${ContractAddress}&chainShortName=amoy_testnet`;
		const resp = await fetch(url, {
			method: 'GET',
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!resp.ok)
			return Error('There was an error fetching data from oklink.');

		// this is nasty but it gives us what we want
		return (await resp.json())['data'][0]['tokenList'];
	}

	// Return an array of owned ticket ids
	async function getOwnedTicketIds() {
		const tmp = await getNFTsInWallet();

		try {
			// parse into an array
			const data = JSON.parse(JSON.stringify(tmp));

			// make temp array
			let owned_ids = Array(0);

			// fill it with the tokenIds
			for (let i = 0; i < data.length; i++) {
				owned_ids.push(data[i]['tokenId']);
			}

			// sort for easy reading
			owned_ids = owned_ids.sort();

			return owned_ids;
		} catch (error) {
			// pls never go here
			throw new Error(
				`Failed to parse the JSON response from the oklink api: ${error}`
			);
		}
	}

	// query the contract (not on network) for the event name for an id
	async function getEventNameFromId(id: bigint) {
		// get the events description from the id
		if (primaryWallet && isEthereumWallet(primaryWallet)) {
			const p = await primaryWallet.getPublicClient();
			if (p) {
				const data = (await p.readContract({
					abi: ContractABI,
					address: ContractAddress,
					functionName: 'get_event_description',
					args: [id]
				})) as string;

				return data;
			} else {
				throw new Error('Failed to create public client.');
			}
		} else {
			throw new Error('Failed to confirm ethereum wallet.');
		}
	}

	// query our backend for the event data using the uuid
	async function getEventByUUID(UUID: string) {
		const tk = getAuthToken();
		const resp = await fetch(`${BASEURL}/user/events?ID=${UUID}`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${tk}` }
		});

		if (!resp.ok) {
			return Error('There was an error fetching event data by UUID');
		}
		return await resp.json();
	}

	// return a dict of our owned ticket ids and event data for each
	async function getAllOwnedEvents() {
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Set time to midnight for accurate comparison
		const ids = (await getOwnedTicketIds()) as bigint[];

		if (ids.length === 0) {
			setTicketData(null);
			return;
		}

		// get all the event names from the ids (calls contract)
		const event_names = Array(ids.length).fill('') as string[];
		let iterator = 0;
		for (let i = 0; i < event_names.length; i++) {
			const id = ids[i];
			event_names[iterator] = await getEventNameFromId(BigInt(id));
			iterator += 1;
		}

		// get the event data for all the events we have
		const ticket_data = [] as TicketInfo[];
		for (let i = 0; i < event_names.length; i++) {
			// grab the event data
			const split = event_names[i].split(' ');
			const uuid = split[split.length - 1];
			const event = (await getEventByUUID(
				uuid
			)) as UserEventDetailsResponse;
			const event_date = new Date(event.EventDatetime);

			// only add the ticket if its in the future (or today)
			if (event_date >= today) {
				ticket_data.push({ ticketid: ids[i], data: event });
			}
		}

		// sort the data by date
		ticket_data.sort((a, b) => {
			const aDate = new Date(a.data.EventDatetime);
			const bDate = new Date(b.data.EventDatetime);

			if (aDate < bDate) {
				return -1;
			}

			if (aDate > bDate) {
				return 1;
			}

			return 0;
		});

		setTicketData(ticket_data);
	}

	const handleUnlinkWalletAndLogout = async () => {
		const id = primaryWallet?.id;
		if (!id) {
			alert('Error unlinking wallet');
			return;
		}
		await handleUnlinkWallet(id);
		await handleLogOut();
	};

	useEffect(() => {
		if (isLoggedIn) {
			getUserBalance();
			setIsWeb2User(userHasEmbeddedWallet());
			getAllOwnedEvents();
		}
	}, [primaryWallet]);

	return (
		<Container size="4">
			<>
				<Box py={'5'}>
					<Heading>Profile</Heading>
				</Box>
				{isLoggedIn ? (
					<>
						<Flex gap="5">
							<LeftColumn>
								<Box width="100%">
									<Flex gap="3" direction={'column'}>
										<Card>
											<Flex gap="3" direction={'column'}>
												<Callout.Root
													variant="soft"
													color="gray"
												>
													<CalloutIconPointer
														onClick={
															handleAddressCopy
														}
													>
														<CopyIcon />
													</CalloutIconPointer>
													<Callout.Text size="3">
														{primaryWallet?.address}
													</Callout.Text>
												</Callout.Root>
												<Text weight="light" size="1">
													This is your wallet address.
													It holds money and your
													event tickets, and can be
													used to send or receive
													both.
												</Text>
											</Flex>
										</Card>
										<Card>
											<Flex gap="3" direction={'column'}>
												<Heading size="4">
													Funding
												</Heading>
												<Flex align="center" gap="2">
													<Text weight="light">
														Exchange
													</Text>
													<Badge color="green">
														Easiest
													</Badge>
												</Flex>
												<Text>
													You can deposit money in
													multiple ways. The easiest
													is to use an exchange
												</Text>
												<ol
													style={{
														paddingLeft: '1.5rem',
														margin: 0
													}}
												>
													<li>
														<Text>
															Buy USDC from
															Coinbase or another
															exchange.
														</Text>
													</li>
													<li>
														<Text>
															Send USDC to your
															wallet address
															above.
														</Text>
													</li>
												</ol>
												<Separator size="4" />
												<Text weight="light">
													Other Options
												</Text>
												<ul
													style={{
														paddingLeft: '1.5rem',
														margin: 0
													}}
												>
													<li>
														<Text>
															Buy directly using a
															wallet like
															Metamask.
														</Text>
													</li>
													<li>
														<Flex
															align="center"
															gap="2"
														>
															<Text>
																Buy directly
																using a credit
																card or PayPal.
															</Text>
															<Badge color="yellow">
																Coming Soon
															</Badge>
														</Flex>
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
												<Heading size="4">
													Balance
												</Heading>
												<Flex gap="3">
													{usdBalance ===
													undefined ? (
														<Skeleton>
															<USDBalance>
																$0.00
															</USDBalance>
														</Skeleton>
													) : (
														<USDBalance>
															$
															{usdBalance?.toFixed(
																2
															)}
														</USDBalance>
													)}
													{balance === undefined ? (
														<Skeleton>
															<TokenBalance>
																0.0000 POL
															</TokenBalance>
														</Skeleton>
													) : (
														<TokenBalance>
															{balance?.toFixed(
																4
															)}{' '}
															POL
														</TokenBalance>
													)}
												</Flex>
											</Flex>
										</Card>
										<Card>
											<Flex gap="3" direction={'column'}>
												<Heading size="4">
													Actions
												</Heading>
												<ActionsText
													onClick={handleSendbalance}
												>
													Send Money
												</ActionsText>
												<ActionsText
													onClick={openFundingOptions}
												>
													Deposit Money
												</ActionsText>
												<ActionsText
													onClick={() =>
														handleLogOut()
													}
												>
													Logout
												</ActionsText>
												{isWeb2User && (
													<>
														<Dialog.Root>
															<Dialog.Trigger>
																<ActionsText color="red">
																	Unlink
																	Account
																</ActionsText>
															</Dialog.Trigger>

															<Dialog.Content maxWidth="450px">
																<Dialog.Title>
																	Unlink
																	Account
																</Dialog.Title>
																<Dialog.Description
																	size="2"
																	mb="4"
																>
																	Make sure
																	you have
																	backed up
																	your private
																	key and
																	recovery
																	phrase
																	before
																	unlinking.
																	After
																	unlinking,
																	you will not
																	be able to
																	access your
																	wallet
																	through this
																	site. If you
																	sign in
																	again, a new
																	wallet will
																	be created
																	for you. You
																	are
																	responsible
																	for
																	safeguarding
																	this
																	information
																</Dialog.Description>

																<Flex
																	direction="column"
																	gap="3"
																>
																	<Button
																		variant="soft"
																		color="gray"
																		onClick={() => {
																			revealWalletKey(
																				{
																					type: 'recoveryPhrase',
																					htmlContainerId:
																						'recovery-phrase-modal'
																				}
																			);
																		}}
																	>
																		View
																		Recovery
																		Phrase
																	</Button>
																	<div id="recovery-phrase-modal"></div>
																</Flex>
																<Flex
																	direction="column"
																	gap="3"
																>
																	<Button
																		variant="soft"
																		color="gray"
																		onClick={() => {
																			revealWalletKey(
																				{
																					type: 'privateKey',
																					htmlContainerId:
																						'private-key-modal'
																				}
																			);
																		}}
																	>
																		View
																		Private
																		Key
																	</Button>
																	<div id="private-key-modal"></div>
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
																		<Button
																			color="red"
																			onClick={
																				handleUnlinkWalletAndLogout
																			}
																		>
																			Unlink
																			Wallet
																			and
																			Logout
																		</Button>
																	</Dialog.Close>
																</Flex>
															</Dialog.Content>
														</Dialog.Root>
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

						<Box py={'5'}>
							<Heading size={'4'}>Your Tickets</Heading>
							<Card>
								<Flex
									style={{
										display: 'flex',
										flexWrap: 'wrap'
									}}
									gap="2"
									flexGrow="1"
								>
									{ticketData === undefined ? (
										<Card>
											<Text>Loading...</Text>
										</Card>
									) : ticketData == null ? (
										<Card>
											<Text>
												You don't own any tickets :\
											</Text>
										</Card>
									) : (
										ticketData?.map(
											(data: TicketInfo, idx: number) => {
												// these make the code read better
												const ticketid =
													data.ticketid.toString();

												return (
													<TicketCard
														key={`${idx}`}
														event={data.data}
														ticket={
															ticketid as string
														}
													/>
												);
											}
										)
									)}
								</Flex>
							</Card>
						</Box>
					</>
				) : (
					<Text>You are not logged in.</Text>
				)}
			</>
		</Container>
	);
}
