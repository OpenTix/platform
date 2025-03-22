import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { UserEventDetailsResponse } from '@platform/types';
import { Box, Card, Flex, Heading, Text, DataList } from '@radix-ui/themes';
import { Avatar } from 'radix-ui';
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
						<Flex
							direction="row"
							gap="5"
							style={{ width: '80%', margin: '2em 10%' }}
						>
							<Card
								style={{
									padding: 0,
									textAlign: 'center',
									alignContent: 'center'
								}}
							>
								<Avatar.Root>
									<Avatar.Image
										src={data.Eventphoto}
										style={{
											maxHeight: '20em',
											maxWidth: '20em',
											objectFit: 'cover'
										}}
									></Avatar.Image>
									<Avatar.Fallback>
										<img
											style={{
												maxHeight: '20em',
												maxWidth: '20em',
												objectFit: 'cover'
											}}
											src="https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?cs=srgb&dl=pexels-vishnurnair-1105666.jpg&fm=jpg"
											alt="Event"
										></img>
									</Avatar.Fallback>
								</Avatar.Root>
							</Card>
							<Flex direction="column" style={{ width: '70%' }}>
								<Heading size="8">{data.Eventname}</Heading>
								<Flex
									direction="row"
									gap="3"
									style={{ justifyContent: 'space-between' }}
								>
									<Flex>
										<DataList.Root size="3">
											<DataList.Item align="center">
												<DataList.Label minWidth="5em">
													Venue
												</DataList.Label>
												<DataList.Value>
													{String(data.Venuename)}
												</DataList.Value>
											</DataList.Item>
											<DataList.Item align="center">
												<DataList.Label minWidth="5em">
													Date
												</DataList.Label>
												<DataList.Value>
													{new Date(
														data.EventDatetime
													).getDay()}
													/
													{new Date(
														data.EventDatetime
													).getMonth()}
													/
													{new Date(
														data.EventDatetime
													).getFullYear()}
												</DataList.Value>
											</DataList.Item>
											<DataList.Item>
												<DataList.Label minWidth="5em">
													Address
												</DataList.Label>
												<DataList.Value>
													{String(data.StreetAddress)}
													<br />
													{String(data.City)},{' '}
													{String(data.Zip)}
												</DataList.Value>
											</DataList.Item>
										</DataList.Root>
									</Flex>
									<Flex style={{ width: '65%' }}>
										<DataList.Root size="3">
											<DataList.Item
												style={{
													maxHeight: '7em',
													overflowY: 'hidden'
												}}
											>
												<DataList.Label
													minWidth="5em"
													maxWidth="10em"
												>
													Description
												</DataList.Label>
												<DataList.Value>
													{String(data.Description)}
												</DataList.Value>
											</DataList.Item>
											<DataList.Item
												style={{
													maxHeight: '7em',
													overflowY: 'hidden'
												}}
											>
												<DataList.Label
													minWidth="5em"
													maxWidth="10em"
												>
													Disclaimer
												</DataList.Label>
												<DataList.Value>
													{String(data.Disclaimer)}
												</DataList.Value>
											</DataList.Item>
											<DataList.Item></DataList.Item>
										</DataList.Root>
									</Flex>
								</Flex>
							</Flex>
						</Flex>
					</Box>
				</Flex>
			) : (
				<Card style={{ width: '80%', margin: '2em 10%' }}>
					Loading ...
				</Card>
			)}
			{
				<Box width="100%">
					<Card style={{ width: '80%', margin: '2em 10%' }}>
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
					BaseCost={(data as UserEventDetailsResponse)?.Basecost}
				/>
			)}
		</div>
	);
}
