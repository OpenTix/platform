import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { getAuthToken, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { UserEventDetailsResponse } from '@platform/types';
import { ExternalLinkIcon } from '@radix-ui/react-icons';
import { Card, Flex, Heading, Inset, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { FullscreenLoadingMessage } from '@platform/ui';
import BuyTicketsModal from '../components/BuyTicketsModal';
import EventDetailsHeader from '../components/EventDetailsHeader';
import EventDetailsMap from '../components/EventDetailsMap';
import ListOfNFTsForEvent from '../components/ListOfNFTsForEvent';

const ColumnsContainer = styled.div`
	box-sizing: border-box;
	width: 100%;
	max-width: 1200px;
	margin: 0 auto;
	display: flex;
	gap: 1em;
	flex-wrap: nowrap;
	position: relative;

	@media (max-width: 768px) {
		flex-wrap: wrap;
		justify-content: center;
	}
`;

const LeftColumn = styled.div`
	flex: 0 0 60%;
	min-width: 300px;
	margin-top: 2em;

	@media (max-width: 768px) {
		flex: 1 1 100%;
		min-width: 0;
	}
`;

const RightColumn = styled.div`
	flex: 0 0 40%;
	position: relative;
	top: -12em;
	min-width: 250px;

	@media (max-width: 768px) {
		flex: 1 1 100%;
		min-width: 0;
		top: 0;
	}
`;

const UnderlineFlex = styled(Flex)`
	cursor: pointer;
	&:hover {
		text-decoration: underline;
	}
`;

export default function EventDetailsPage() {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const id = useParams().id!;
	const [shouldShowBuyModal, setShouldShowBuyModal] =
		useState<boolean>(false);
	const [shouldGrayOutPage, setShouldGrayOutPage] = useState<boolean>(false);
	const [data, setData] = useState<UserEventDetailsResponse>();
	const [TicketID, setTicketID] = useState<bigint>(BigInt(0));
	const [nftRefreshCounter, setNftRefreshCounter] = useState<number>(0);
	const { primaryWallet } = useDynamicContext();

	const fallbackURL =
		'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?cs=srgb&dl=pexels-vishnurnair-1105666.jpg&fm=jpg';

	async function getEventDetails() {
		const authToken = getAuthToken();
		const resp = await fetch(
			`${process.env.NX_PUBLIC_API_BASEURL}/user/events?ID=${id}`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${authToken}` }
			}
		);
		if (!resp.ok) {
			return null;
		}
		Promise.resolve(resp.json()).then((d) => {
			setData(d);
		});
	}

	const waitForInclusion = async (hash: string) => {
		setShouldGrayOutPage(true);
		try {
			if (primaryWallet && isEthereumWallet(primaryWallet)) {
				const p = await primaryWallet.getPublicClient();
				if (p) {
					if (hash.startsWith('0x')) {
						hash = hash.slice(2);
					}
					await p.waitForTransactionReceipt({
						hash: `0x${hash}`
					});
					setShouldGrayOutPage(false);
					setNftRefreshCounter((prev) => prev + 1);
				}
			} else {
				throw new Error('Failed to confirm ethereum wallet.');
			}
		} catch (error) {
			console.error(error);
			throw new Error('Failed to wait for block inclusion.');
		}
	};

	useEffect(() => {
		getEventDetails();
	}, []);

	return (
		<div>
			{data ? (
				<>
					<EventDetailsHeader data={data} />
					<ColumnsContainer>
						<LeftColumn>
							<Flex
								direction="column"
								gap="5"
								justify={'center'}
								style={{ width: '80%', margin: 'auto' }}
							>
								<Card>
									<Heading size={'4'} mb="2">
										Event Details:
									</Heading>
									<Text as="p" size="3" mb="2">
										{data.Description}
									</Text>
								</Card>
								<Card>
									<Heading size={'4'} mb="2">
										Tickets for this event:
									</Heading>

									<ListOfNFTsForEvent
										key={`nft-${nftRefreshCounter}`}
										Title={
											(data as UserEventDetailsResponse)
												?.Eventname
										}
										EventDatetime={
											(data as UserEventDetailsResponse)
												?.EventDatetime
										}
										ID={
											(data as UserEventDetailsResponse)
												?.ID
										}
										setTicketId={(num: bigint) =>
											setTicketID(num)
										}
										setShouldShowBuyModal={(
											bool: boolean
										) => setShouldShowBuyModal(bool)}
									/>
								</Card>
							</Flex>
						</LeftColumn>

						<RightColumn>
							<Flex
								direction="column"
								gap="5"
								justify={'center'}
								style={{ width: '80%', margin: 'auto' }}
							>
								<Card>
									<Inset
										clip="padding-box"
										side="top"
										pb="current"
									>
										<img
											src={data.Venuephoto || fallbackURL}
											alt="Venue"
											style={{
												width: '100%',
												objectFit: 'contain',
												display: 'block'
											}}
										/>
									</Inset>
									<UnderlineFlex
										gap="2"
										align="center"
										mb="2"
										onClick={() => {
											window.open(
												`https://www.google.com/maps/place/${data.StreetAddress},+${data.City},+${data.StateCode}+${data.Zip}`,
												'_blank'
											);
										}}
									>
										<Heading size="4">
											{data.Venuename}
										</Heading>
										<ExternalLinkIcon />
									</UnderlineFlex>
									<Text as="p" size="3">
										{data.StreetAddress}
									</Text>
									<Text as="p" size="3">
										{data.City}, {data.StateCode} {data.Zip}
									</Text>
								</Card>
								<Card
									style={{ padding: 0, overflow: 'hidden' }}
								>
									<EventDetailsMap data={data} />
								</Card>

								<Card>
									<Heading size={'4'} mb="2">
										Disclaimers:
									</Heading>
									<Text as="p" size="3" mb="2">
										{data.Disclaimer}
									</Text>
								</Card>
							</Flex>
						</RightColumn>
					</ColumnsContainer>
				</>
			) : (
				<p>Loading ...</p>
			)}

			{shouldShowBuyModal && (
				<BuyTicketsModal
					onClose={() => setShouldShowBuyModal(false)}
					passTransactionHash={(hash) => waitForInclusion(hash)}
					Title={(data as UserEventDetailsResponse)?.Eventname}
					EventDatetime={
						(data as UserEventDetailsResponse)?.EventDatetime
					}
					ID={(data as UserEventDetailsResponse)?.ID}
					TicketID={TicketID}
					BaseCost={(data as UserEventDetailsResponse)?.Basecost}
				/>
			)}

			{shouldGrayOutPage && (
				<FullscreenLoadingMessage message="Waiting for your ticket to be included in a block..." />
			)}
		</div>
	);
}
