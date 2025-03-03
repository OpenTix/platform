import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { UserEventDetailsResponse } from '@platform/types';
import { Box, Card, Flex, Heading, Text, DataList } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BuyTicketsModal from '../components/BuyTicketsModal';
import ListOfNFTsForEvent from '../components/ListOfNFTsForEvent';

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
				<Flex gap="5" py={'5'}>
					<Box width="100%">
						<Card>
							<Flex direction="column" gap="3">
								<Heading size={'4'}>Event Information</Heading>
								<DataList.Root>
									{data &&
										Object.entries(data).map(
											([key, value]) => (
												<DataList.Item
													align="center"
													key={key}
												>
													<DataList.Label minWidth="88px">
														{key}
													</DataList.Label>
													<DataList.Value>
														{String(value)}
													</DataList.Value>
												</DataList.Item>
											)
										)}
								</DataList.Root>
							</Flex>
						</Card>
					</Box>
				</Flex>
			) : (
				// this is temporary
				<div>No data :\</div>
			)}
			{
				<Box width="100%">
					<Card>
						<Heading size={'4'}>Tickets for this event:</Heading>
						{data ? (
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
								setTicketId={(num: bigint) => setTicketID(num)}
								setShouldShowBuyModal={(bool: boolean) =>
									setShouldShowBuyModal(bool)
								}
							/>
						) : (
							<Text>Loading tickets...</Text>
						)}
					</Card>
				</Box>
			}
			{shouldShowBuyModal && (
				<BuyTicketsModal
					onClose={() => setShouldShowBuyModal(false)}
					Title={(data as UserEventDetailsResponse)?.Eventname}
					EventDatetime={
						(data as UserEventDetailsResponse)?.EventDatetime
					}
					ID={(data as UserEventDetailsResponse)?.ID}
					TicketID={TicketID}
				/>
			)}
		</div>
	);
}
