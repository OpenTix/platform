import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { UserEventResponse } from '@platform/types';
import { eventTypes } from '@platform/types';
import {
	Box,
	Container,
	Flex,
	Text,
	TextField,
	Card,
	Select,
	Heading,
	Button
} from '@radix-ui/themes';
import {
	useQuery,
	QueryClient,
	QueryClientProvider
} from '@tanstack/react-query';
import { User } from 'aws-cdk-lib/aws-iam';
import { Popover, Toolbar } from 'radix-ui';
import { useState } from 'react';
import styled from 'styled-components';
import { useSessionStorage } from 'usehooks-ts';
import EventRow from '../components/EventRow';

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
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
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
	const [page, setPage] = useSessionStorage('Page', 1);
	const [zip, setZip] = useSessionStorage('Zip', '');
	const [type, setType] = useSessionStorage('Type', '');
	const [ename, setEname] = useSessionStorage('Name', '');
	const [cost, setCost] = useSessionStorage('Cost', 1000000);

	const [eventDate, setEventDate] = useSessionStorage(
		'Date',
		new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
			.toISOString()
			.slice(0, 16)
	);
	const [tempType, setTempType] = useState(type);
	const [tempCost, setTempCost] = useState(cost);
	const [tempZip, setTempZip] = useState(zip);
	const [tempEventDate, setTempEventDate] = useState(eventDate);
	const [tempEname, setTempEname] = useState(ename);

	const applyFilters = () => {
		setType(tempType);
		setCost(tempCost);
		setZip(tempZip);
		setEventDate(tempEventDate);
		setEname(tempEname);
	};

	const resetFilters = () => {
		setTempType('');
		setTempCost(1000000);
		setTempZip('');
		setTempEventDate(
			new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
				.toISOString()
				.slice(0, 16)
		);

		setType('');
		setCost(1000000);
		setZip('');
		setEventDate(
			new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
				.toISOString()
				.slice(0, 16)
		);
		setEname('');
	};

	function Events() {
		const { isPending, isError, data, error } = useQuery({
			queryKey: ['events'],
			queryFn: getEvents
		});

		if (isPending) {
			return <Text key="events loading"> Loading... </Text>;
		}

		if (isError) {
			console.error(error.message);
			return <Text key="events error"> Error: {error.message} </Text>;
		}

		return (
			<Flex key="event_card_root" direction="column" gap="3">
				{data && data.length > 0 ? (
					data.map((group: UserEventResponse[], idx: number) => {
						return group && group.length > 0 ? (
							<EventRow
								key={`Event_Row_${idx}`}
								group={group}
							></EventRow>
						) : (
							<Box key={`No_Data_${idx}`}></Box>
						);
					})
				) : (
					<Card key={'pageError'}>
						<Text>
							There are no results of this type for page {page}
						</Text>
					</Card>
				)}
			</Flex>
		);
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
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
		let date;
		let events: UserEventResponse[][] = [];
		try {
			date = new Date(eventDate).toISOString();
		} catch {
			date = new Date().toISOString();
			await setEventDate(
				new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
					.toISOString()
					.slice(0, 16)
			);
		}

		const requests = eventTypes.map((type) =>
			fetch(
				`${process.env.NX_PUBLIC_API_BASEURL}/user/events?Page=${page}&Zip=${zip}&Type=${type}&Name=${ename}&Basecost=${cost}&EventDatetime=${date}`,
				{
					method: 'GET',
					headers: { Authorization: `Bearer ${authToken}` }
				}
			)
		);

		await Promise.allSettled(requests).then(async (responses) => {
			const data = await Promise.all(
				responses.map(async (response) => {
					if (response.status === 'fulfilled') {
						return await response.value.json();
					} else if (response.status === 'rejected') {
						console.error(response.reason);
					}
					return null;
				})
			);
			events = data;
		});

		return events;
	}

	return (
		<Flex>
			<Box style={{ marginTop: '10px' }}>
				<Flex gap="1" direction="column">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							setEname(tempEname);
						}}
					>
						<Flex gap="2" align="center">
							<Toolbar.Root>
								<TBButton
									type="submit"
									style={{
										backgroundColor: '#4e3282',
										color: 'white'
									}}
								>
									<span role="img" aria-label="Search">
										🔍
									</span>
								</TBButton>
							</Toolbar.Root>
							<TextField.Root
								placeholder="Search"
								size="3"
								name="Name"
								value={tempEname}
								onChange={(e) => setTempEname(e.target.value)}
							/>
						</Flex>
					</form>
					<Popover.Root>
						<Popover.Trigger
							style={{
								backgroundColor: 'var(--purple-12)',
								borderRadius: '5px',
								color: 'white'
							}}
						>
							Filter
						</Popover.Trigger>
						<Flex gap="3" direction="column" width={'150px'}>
							<Popover.Content
								style={{ width: '150px', padding: '10px' }}
							>
								<label>
									<Text
										as="div"
										size="2"
										mb="1"
										weight="bold"
									>
										Type
									</Text>
								</label>
								<Select.Root
									value={tempType}
									onValueChange={setTempType}
								>
									<Select.Trigger placeholder="Select Event Type" />
									<Select.Content>
										<Select.Group>
											{eventTypes.map((event) => (
												<Select.Item
													key={event}
													value={event}
												>
													{event}
												</Select.Item>
											))}
										</Select.Group>
									</Select.Content>
								</Select.Root>
								<Label>
									<Text
										as="div"
										size="2"
										mb="1"
										weight="bold"
									>
										Maximum Cost
									</Text>
									<TextField.Root
										name="Cost"
										placeholder="1000000"
										value={tempCost}
										onChange={(e) =>
											setTempCost(Number(e.target.value))
										}
									/>
								</Label>
								<Label>
									<Text
										as="div"
										size="2"
										mb="1"
										weight="bold"
									>
										Time
									</Text>
									<TextField.Root
										name="Time"
										value={tempEventDate}
										onChange={(e) =>
											setTempEventDate(e.target.value)
										}
										type="datetime-local"
									/>
								</Label>
								<Label>
									<Text>Zip</Text>
									<TextField.Root
										name="Zip"
										value={tempZip}
										onChange={(e) =>
											setTempZip(e.target.value)
										}
										pattern={'{d}[5]'}
									/>
								</Label>
								<Toolbar.Root>
									<TBButton
										onClick={resetFilters}
										style={{ backgroundColor: 'red' }}
									>
										Clear Filters
									</TBButton>
									<TBButton onClick={applyFilters}>
										Apply Filters
									</TBButton>
								</Toolbar.Root>
							</Popover.Content>
						</Flex>
					</Popover.Root>
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
