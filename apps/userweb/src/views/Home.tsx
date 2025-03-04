import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { UserEventResponse } from '@platform/types';
import {
	Box,
	Container,
	Flex,
	Text,
	TextField,
	Card,
	Inset
} from '@radix-ui/themes';
import {
	useQuery,
	QueryClient,
	QueryClientProvider
} from '@tanstack/react-query';
import { Avatar, Toolbar } from 'radix-ui';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const queryClient = new QueryClient();

const TBButton = styled(Toolbar.Button)`
	padding-left: 10px;
	padding-right: 10px;
	color: white;
	background-color: #4e3282;
	border-radius: 6px;
	&:hover {
		background-color: #30304a;
		color: white;
	}
`;

const TBRoot = styled(Toolbar.Root)`
	max-width: 30vw;
	width: fit-content;
	display: flex;
	padding: 10px;
	min-width: max-content;
	border-radius: 6px;
	background-color: white;
	box-shadow: 0 2px 10px black;
	column-gap: 5px;
	margin-top: 10px;
`;

const Label = styled.label`
	display: flex;
	flex-direction: row;
	column-gap: 10px;
	width: inherit;
`;

export default function Home() {
	const [page, setPage] = useState<number>(1);
	const [zip, setZip] = useState<string>('');
	const [type, setType] = useState<string>('');
	const [ename, setEname] = useState<string>('');
	const [cost, setCost] = useState<number>(1000000);
	const [eventDate, setEventDate] = useState<string>(
		new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
			.toISOString()
			.slice(0, 16)
	);

	function Events() {
		const { isPending, isError, data, error } = useQuery({
			queryKey: ['events'],
			queryFn: getEvents
		});

		if (isPending) {
			return <Text> Loading... </Text>;
		}

		if (isError) {
			console.error(error.message);
			return <Text>Error: {error.message}</Text>;
		}

		return (
			data?.map((data: UserEventResponse, idx: number) => {
				const keys = Object.keys(data);
				console.log(keys);
				const photo_uri = data?.Photo;
				return (
					<Card asChild key={idx} size={'3'} variant="classic">
						<Link
							to={`/event/${data.ID}`}
							style={{ display: 'inline-flex' }}
						>
							<Box style={{ display: 'inline-flex' }}>
								<Inset
									side="left"
									style={{ paddingRight: '10px' }}
								>
									<Avatar.Root>
										<Avatar.Image
											style={{
												maxWidth: '200px',
												height: '100%'
											}}
											src={photo_uri}
											alt="Image of venue"
										/>
										<Avatar.Fallback delayMs={1500}>
											{/* No Image */}
										</Avatar.Fallback>
									</Avatar.Root>
								</Inset>
								<Flex
									direction="column"
									style={{ paddingLeft: '5px' }}
								>
									{Object.values(data)?.map(
										(
											value: string | number,
											idx: number
										) => {
											if (keys[idx] === 'Photo') {
												// photo_uri = value as string;
												return null;
											} else if (keys[idx] === 'ID') {
												return null;
											}
											return (
												<Text key={idx} color="violet">
													{keys[idx]}:{' '}
													{keys[idx] ===
													'EventDatetime'
														? new Date(
																value
															).toLocaleString()
														: keys[idx] ===
															  'Basecost'
															? `$${value}`
															: value}
												</Text>
											);
										}
									)}
								</Flex>
							</Box>
						</Link>
					</Card>
				);
			}) ?? (
				<Card>
					<Text>There are no results for page {page}</Text>
				</Card>
			)
		);
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type } = e.target;
		switch (name) {
			case 'Type':
				setType(value);
				break;
			case 'Cost':
				setCost(Number(value));
				break;
			case 'Time':
				setEventDate(value);
				break;
			case 'Zip':
				setZip(value);
				break;
			case 'Name':
				setEname(value);
				break;
			default:
				break;
		}
	};

	async function getEvents() {
		const authToken = getAuthToken();
		const resp = await fetch(
			`${process.env.NX_PUBLIC_API_BASEURL}/user/events?Page=${page}&Zip=${zip}&Type=${type}&Name=${ename}&Basecost=${cost}&EventDatetime=${new Date(eventDate).toISOString()}`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${authToken}` }
			}
		);
		if (!resp.ok) return Error('There was an error fetching data');
		return await resp.json();
	}

	return (
		<Flex>
			<Box style={{ marginTop: '10px' }}>
				<Flex gap="1" direction="column">
					<Label>
						<Text as="div" size="2" mb="1" weight="bold">
							Type
						</Text>
						<TextField.Root
							name="Type"
							placeholder="Concert"
							value={type}
							onChange={handleChange}
						/>
					</Label>
					<Label>
						<Text as="div" size="2" mb="1" weight="bold">
							Maximum Cost
						</Text>
						<TextField.Root
							name="Cost"
							placeholder="1000000"
							value={cost}
							onChange={handleChange}
						/>
					</Label>
					<Label>
						<Text as="div" size="2" mb="1" weight="bold">
							Time
						</Text>
						<TextField.Root
							name="Time"
							value={eventDate}
							onChange={handleChange}
							type="datetime-local"
						/>
					</Label>
					<Label>
						<Text>Zip</Text>
						<TextField.Root
							name="Zip"
							value={zip}
							onChange={handleChange}
							pattern={'{d}[5]'}
						/>
					</Label>
				</Flex>
			</Box>
			<Container style={{ alignSelf: 'center' }} size={'4'}>
				<Box style={{ maxWidth: '90vw', padding: '16px 16px' }}>
					<QueryClientProvider client={queryClient}>
						<Flex direction="column" gap="3">
							<Events />
						</Flex>
					</QueryClientProvider>
					<TBRoot>
						{page > 1 ? (
							<TBButton
								onClick={() => setPage(page - 1)}
								value={page - 1}
							>
								{page - 1}
							</TBButton>
						) : null}
						<TBButton
							style={{ backgroundColor: 'black' }}
							onClick={() => setPage(page)}
							value={page}
						>
							{page}
						</TBButton>
						<TBButton
							onClick={() => setPage(page + 1)}
							value={page + 1}
						>
							{page + 1}
						</TBButton>
						{page === 1 ? (
							<TBButton
								onClick={() => setPage(page + 2)}
								value={page + 2}
							>
								{page + 2}
							</TBButton>
						) : null}
						<Toolbar.Separator>...</Toolbar.Separator>
						<TBButton
							onClick={() => {
								setPage(page + 4);
							}}
							value={page + 4}
						>
							{page + 4}
						</TBButton>
					</TBRoot>
				</Box>
			</Container>
		</Flex>
	);
}
