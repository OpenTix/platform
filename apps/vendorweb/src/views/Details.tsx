import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { getAuthToken, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Group } from '@mantine/core';
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import {
	ContractABI,
	ContractAddress,
	ContractGetEventIdsReturnedMetadata
} from '@platform/blockchain';
import { Event, Venue } from '@platform/types';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import {
	Box,
	Callout,
	Card,
	DataList,
	Flex,
	Heading,
	Text
} from '@radix-ui/themes';
import { IconUpload, IconPhoto, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { SuccessAlert } from '@platform/ui';
import { FullscreenLoadingMessage } from '@platform/ui';
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
	.dark &:hover {
		background-color: var(--accent-a3);
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
	const [wasUpdateSuccessful, setWasUpdateSuccessful] =
		useState<boolean>(false);
	const [shouldShowError, setShouldShowError] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [isImageUploading, setIsImageUploading] = useState<boolean>(false);
	const [shouldGrayOutPage, setShouldGrayOutPage] = useState<boolean>(false);
	const [latestTransactionHash, setLatestTransactionHash] =
		useState<string>('');

	const { primaryWallet } = useDynamicContext();

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

	const handleFileUpload = async (files: FileWithPath[]) => {
		setIsImageUploading(true);
		const file = files[0];
		try {
			const token = getAuthToken();
			const res = await fetch(
				process.env.NX_PUBLIC_API_BASEURL +
					`/vendor/${typestring}s/photos`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						ID: id,
						Filename: file.name
					})
				}
			);

			if (!res.ok) {
				console.error(res);
				setErrorMessage('Failed to upload photo');
				setShouldShowError(true);
				setIsImageUploading(false);
				return;
			}

			const data = await res.json();
			const signedUrl = data.Request.URL;
			const res2 = await fetch(signedUrl, {
				method: 'PUT',
				headers: {
					'Content-Type': file.type || 'application/octet-stream'
				},
				body: file
			});

			if (!res2.ok) {
				console.error(res2);
				setErrorMessage('Failed to upload photo');
				setShouldShowError(true);
				setIsImageUploading(false);
				return;
			}

			setTimeout(() => {
				setIsImageUploading(false);
				setShouldShowError(false);
				fetchData();
			}, 2000);
		} catch (error) {
			console.error(error);
			setErrorMessage('Failed to upload photo');
			setShouldShowError(true);
			setIsImageUploading(false);
		}
	};

	const handleDeletePhoto = async () => {
		try {
			const token = getAuthToken();
			const res = await fetch(
				process.env.NX_PUBLIC_API_BASEURL +
					`/vendor/${typestring}s/photos`,
				{
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						ID: id
					})
				}
			);
			if (!res.ok) {
				console.error(res);
				setErrorMessage('Failed to delete photo');
				setShouldShowError(true);
				return;
			}
			setTimeout(() => {
				fetchData();
			}, 1000);
			setShouldShowError(false);
		} catch (error) {
			console.error(error);
			setErrorMessage('Failed to delete photo');
			setShouldShowError(true);
		}
	};

	const createTicketsOnBackend = async (min: bigint, max: bigint) => {
		try {
			const token = getAuthToken();
			const res = await fetch(
				process.env.NX_PUBLIC_API_BASEURL +
					`/vendor/events/tickets/create`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						Event: id,
						TicketMin: Number(min),
						TicketMax: Number(max),
						Contract: ContractAddress
					})
				}
			);
			if (!res.ok) {
				const d = await res.json();
				console.error(res);
				setErrorMessage(d.message);
				setShouldShowError(true);
				return;
			}
		} catch (error) {
			console.error(error);
			setErrorMessage('Failed to create tickets on backend');
			setShouldShowError(true);
		}
	};

	const updateTransactionHash = async (hash: string) => {
		setLatestTransactionHash(hash);
		setShouldGrayOutPage(true);
		const NFTMintingDescription = `${(data as Event)?.Name} at ${(data as Event)?.EventDatetime} - ${(data as Event)?.ID}`;
		try {
			if (primaryWallet && isEthereumWallet(primaryWallet)) {
				const p = await primaryWallet.getPublicClient();
				if (p) {
					if (hash.startsWith('0x')) {
						hash = hash.slice(2);
					}
					const transaction = await p.waitForTransactionReceipt({
						hash: `0x${hash}`
					});
					console.log(transaction);
					const dataFromContract = (await p.readContract({
						abi: ContractABI,
						address: ContractAddress,
						functionName: 'get_event_ids',
						args: [NFTMintingDescription]
					})) as [bigint[], ContractGetEventIdsReturnedMetadata];
					console.log(dataFromContract[1]);
					await createTicketsOnBackend(
						dataFromContract[1].min,
						dataFromContract[1].max
					);
					setShouldGrayOutPage(false);
					fetchData();
				}
			} else {
				throw new Error('Failed to confirm ethereum wallet.');
			}
		} catch (error) {
			console.error(error);
			throw new Error('Failed to update transaction hash');
		}
	};
	useEffect(() => {
		if (!shouldShowEditModal && validateUUID()) {
			fetchData();
		}
	}, [shouldShowEditModal]);

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
			{wasUpdateSuccessful && (
				<SuccessAlert message="Updated Successfully" />
			)}
			{shouldShowError && (
				<Callout.Root color="red">
					<Callout.Icon>
						<InfoCircledIcon />
					</Callout.Icon>
					<Callout.Text>{errorMessage}</Callout.Text>
				</Callout.Root>
			)}
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
								<Flex direction="column" gap="3" align="center">
									{data &&
										(data?.Photo ? (
											<img
												src={data.Photo}
												alt="Venue"
												style={{ maxWidth: '80%' }}
											/>
										) : (
											<Box
												style={{
													width: '90%'
												}}
											>
												<Dropzone
													onDrop={(files) =>
														handleFileUpload(files)
													}
													onReject={(files) =>
														console.log(
															'rejected files',
															files
														)
													}
													maxSize={5 * 1024 ** 2}
													accept={IMAGE_MIME_TYPE}
													loading={isImageUploading}
												>
													<Group
														justify="center"
														gap="xl"
														mih={220}
														style={{
															pointerEvents:
																'none'
														}}
													>
														<Dropzone.Accept>
															<IconUpload
																size={52}
																color="#00c7b7"
																stroke={1.5}
															/>
														</Dropzone.Accept>
														<Dropzone.Reject>
															<IconX
																size={52}
																color="#ff5252"
																stroke={1.5}
															/>
														</Dropzone.Reject>
														<Dropzone.Idle>
															<IconPhoto
																size={52}
																color="#666"
																stroke={1.5}
															/>
														</Dropzone.Idle>

														<div>
															<Text>
																Drag an image
																here or click.
															</Text>
														</div>
													</Group>
												</Dropzone>
											</Box>
										))}
								</Flex>
							</Card>
							<Card>
								<Heading size={'4'}>Actions</Heading>
								<Flex direction="column" gap="3">
									<ActionsText
										onClick={() => {
											setShouldShowEditModal(true);
										}}
										color="gray"
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
												color="gray"
											>
												Mint
											</ActionsText>
										)}
									{data?.Photo && (
										<ActionsText
											onClick={handleDeletePhoto}
											color="red"
										>
											Delete Photo
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
						onSuccess={() => setWasUpdateSuccessful(true)}
					/>
				) : (
					<EditVenueModal
						pk={data?.Pk ?? 0}
						onClose={() => setShouldShowEditModal(false)}
						onSuccess={() => setWasUpdateSuccessful(true)}
					/>
				))}

			{shouldShowMintModal && typestring === 'event' && (
				<MintTicketsModal
					onClose={() => setShouldShowMintModal(false)}
					passTransactionHash={(val) => updateTransactionHash(val)}
					Basecost={(data as Event)?.Basecost}
					NumGa={(data as Event)?.NumGa}
					NumUnique={(data as Event)?.NumUnique}
					Title={(data as Event)?.Name}
					EventDatetime={(data as Event)?.EventDatetime}
					ID={(data as Event)?.ID}
					Pk={(data as Event)?.Pk}
				/>
			)}

			{shouldGrayOutPage && (
				<FullscreenLoadingMessage message="Waiting for block inclusion. Please don't navigate away or refresh the page..." />
			)}
		</>
	);
}
