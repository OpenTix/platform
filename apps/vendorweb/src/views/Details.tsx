import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { Event, Venue } from '@platform/types';
import { Box, Card, DataList, Flex, Heading, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import EditEventModal from '../components/EditEventModal';
import EditVenueModal from '../components/EditVenueModal';
import ListOfNFTsForEvent from '../components/ListOfNFTsForEvent';
import MintTicketsModal from '../components/MintTicketsModal';

//70/30 left right column split
const LeftColumn = styled.div`
	width: 50%;
	display: flex;
	flex-direction: column;
	align-items: center;
`;
const RightColumn = styled.div`
	width: 50%;
	display: flex;
	flex-direction: column;
	align-items: center;
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

export interface DetailsProps {
	typestring: 'venue' | 'event';
}
export default function Details({ typestring }: DetailsProps) {
	//eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const id = useParams().id!;
	const [data, setData] = useState<Venue | Event>();
	const [shouldShowEditModal, setShouldShowEditModal] =
		useState<boolean>(false);
	const [shouldShowMintModal, setShouldShowMintModal] =
		useState<boolean>(false);

	const validateUUID = () => {
		if (
			!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89ab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i.test(
				id
			)
		) {
			throw new Error('Invalid UUID');
		}
		return true;
	};

	const fetchData = async () => {
		try {
			const token = getAuthToken();
			const res = await fetch(
				process.env.NX_PUBLIC_API_BASEURL +
					`/vendor/${typestring}s/?ID=${id}`,
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			);
			if (res.ok) {
				const data = await res.json();
				setData(data);
			} else {
				throw new Error('Failed to fetch venue');
			}
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		if (validateUUID()) {
			fetchData();
		}
	}, []);

	return (
		<>
			<Box py={'5'}>
				<Heading>
					{typestring.charAt(0).toUpperCase() + typestring.slice(1)}{' '}
					Details - {data?.Name}
				</Heading>
			</Box>
			<Flex gap="5" py={'5'}>
				<LeftColumn>
					<Box width="100%">
						<Card>
							<Flex direction="column" gap="3">
								<Heading size={'4'}>Data</Heading>
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
				</LeftColumn>
				<RightColumn>
					<Box width="100%">
						<Flex direction="column" gap="3">
							<Card>
								<Heading size={'4'}>Photo</Heading>
								<Flex direction="column" gap="3">
									{data?.Photo ? (
										<Text>photo</Text>
									) : (
										<Text>No photo</Text>
									)}
								</Flex>
							</Card>
							<Card>
								<Heading size={'4'}>Actions</Heading>
								<Flex direction="column" gap="3">
									<ActionsText
										onClick={() => {
											setShouldShowEditModal(true);
										}}
									>
										Edit
									</ActionsText>
									{typestring === 'event' &&
										!(data as Event)?.TransactionHash && (
											<ActionsText
												onClick={() => {
													setShouldShowMintModal(
														true
													);
												}}
											>
												Mint
											</ActionsText>
										)}
								</Flex>
							</Card>
						</Flex>
					</Box>
				</RightColumn>
			</Flex>
			{typestring === 'event' && (
				<Box width="100%">
					<Card>
						<Heading size={'4'}>NFTs for this event:</Heading>
						{data && (data as Event)?.TransactionHash ? (
							<ListOfNFTsForEvent
								Title={(data as Event)?.Name}
								EventDatetime={(data as Event)?.EventDatetime}
								ID={(data as Event)?.ID}
							/>
						) : (
							<Text>
								You have not minted NFTs for this event yet.
							</Text>
						)}
					</Card>
				</Box>
			)}

			{shouldShowEditModal &&
				(typestring === 'event' ? (
					<EditEventModal
						pk={data?.Pk ?? 0}
						onClose={() => setShouldShowEditModal(false)}
					/>
				) : (
					<EditVenueModal
						pk={data?.Pk ?? 0}
						onClose={() => setShouldShowEditModal(false)}
					/>
				))}

			{shouldShowMintModal && typestring === 'event' && (
				<MintTicketsModal
					onClose={() => setShouldShowMintModal(false)}
					Basecost={(data as Event)?.Basecost}
					NumGa={(data as Event)?.NumGa}
					NumUnique={(data as Event)?.NumUnique}
					Title={(data as Event)?.Name}
					EventDatetime={(data as Event)?.EventDatetime}
					ID={(data as Event)?.ID}
					Pk={(data as Event)?.Pk}
				/>
			)}
		</>
	);
}
