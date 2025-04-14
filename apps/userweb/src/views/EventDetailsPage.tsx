import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { UserEventDetailsResponse } from '@platform/types';
import { Box, Card, Heading, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import BuyTicketsModal from '../components/BuyTicketsModal';
import EventDetailsHeader from '../components/EventDetailsHeader';
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
	background: #f5f5f5;
	min-width: 300px;
	margin-top: 2em;

	@media (max-width: 768px) {
		flex: 1 1 100%;
		min-width: 0;
	}
`;

const RightColumn = styled.div`
	flex: 0 0 40%;
	background: #fafafa;
	position: relative;
	top: -5em;
	min-width: 250px;

	@media (max-width: 768px) {
		flex: 1 1 100%;
		min-width: 0;
		top: 0;
	}
`;

export default function EventDetailsPage() {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const id = useParams().id!;
	const [shouldShowBuyModal, setShouldShowBuyModal] =
		useState<boolean>(false);
	const [data, setData] = useState<UserEventDetailsResponse>();
	const [TicketID, setTicketID] = useState<bigint>(BigInt(0));

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
							<Card style={{ width: '90%', margin: 'auto' }}>
								<Heading size={'4'}>
									Tickets for this event:
								</Heading>

								<ListOfNFTsForEvent
									Title={
										(data as UserEventDetailsResponse)
											?.Eventname
									}
									EventDatetime={
										(data as UserEventDetailsResponse)
											?.EventDatetime
									}
									ID={(data as UserEventDetailsResponse)?.ID}
									setTicketId={(num: bigint) =>
										setTicketID(num)
									}
									setShouldShowBuyModal={(bool: boolean) =>
										setShouldShowBuyModal(bool)
									}
								/>
							</Card>
						</LeftColumn>

						<RightColumn>
							<Heading size="4">Right Column Content</Heading>
							<Text>
								This right column overlaps the header by moving
								upward.
							</Text>
							{/* ...other content... */}
						</RightColumn>
					</ColumnsContainer>
				</>
			) : (
				<p>Loading ...</p>
			)}

			{shouldShowBuyModal && (
				<BuyTicketsModal
					onClose={() => setShouldShowBuyModal(false)}
					Title={(data as UserEventDetailsResponse)?.Eventname}
					EventDatetime={
						(data as UserEventDetailsResponse)?.EventDatetime
					}
					ID={(data as UserEventDetailsResponse)?.ID}
					TicketID={TicketID}
					BaseCost={(data as UserEventDetailsResponse)?.Basecost}
				/>
			)}
		</div>
	);
}
