import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { Venue, Event } from '@platform/types';
import {
	Tabs,
	Box,
	Flex,
	TextField,
	Button,
	Container,
	Text
} from '@radix-ui/themes';
import {
	useQuery,
	QueryClient,
	QueryClientProvider
} from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { useSessionStorage } from 'usehooks-ts';
import { SuccessAlert } from '@platform/ui';
import AddEventModal from '../components/AddEventModal';
import AddVenueModal from '../components/AddVenueModal';
import VendorTable from '../components/VendorTable';

interface queryParams {
	page: number;
}

const queryClient = new QueryClient();

export default function Home() {
	const [venuesPage, setVenuesPage] = useState<number>(1);
	const [eventsPage, setEventsPage] = useState<number>(1);
	const [eventsHistoryPage, setEventsHistoryPage] = useState<number>(1);
	const [filter, setFilter] = useState<string>('');
	const tempFilter = useRef<string>('');

	const [activeTab, setActiveTab] = useSessionStorage(
		'VendorActiveHomeTab',
		'events'
	);
	const [showModal, setShowModal] = useState(false);
	const [modalType, setModalType] = useState<'events' | 'venues' | null>(
		null
	);
	const [wasAddSuccessful, setWasAddSuccessful] = useState<boolean>(false);

	function Venues({ page }: queryParams) {
		const { isPending, isError, data, error } = useQuery({
			queryKey: ['venues', { page }],
			queryFn: fetchVenues
		});

		if (isPending) {
			return <Text> Loading... </Text>;
		}

		if (isError) {
			console.error(error.message);
			return <Text>Error: {error.message}</Text>;
		}

		return <VendorTable rowData={data} tableType="venue" />;
	}

	function Events({ page }: queryParams) {
		const { isPending, isError, data, error } = useQuery({
			queryKey: ['events', { page }],
			queryFn: fetchEvents
		});

		if (isPending) {
			return <Text> Loading... </Text>;
		}

		if (isError) {
			console.error(error.message);
			return <Text> Error: {error.message} </Text>;
		}

		return <VendorTable rowData={data} tableType="event" />;
	}

	function HistoricalEvents({ page }: queryParams) {
		const { isPending, isError, data, error } = useQuery({
			queryKey: ['historical_events', { page }],
			queryFn: fetchHistoricalEvents
		});

		if (isPending) {
			return <Text> Loading... </Text>;
		}

		if (isError) {
			console.error(error.message);
			return <Text> Error: {error.message} </Text>;
		}

		return <VendorTable rowData={data} tableType="event" />;
	}

	async function fetchVenues({
		queryKey
	}: {
		queryKey: [string, queryParams];
	}) {
		const [_key, { page }] = queryKey;
		const authToken = getAuthToken();
		console.log(_key, page);
		return await fetch(
			`${process.env.NX_PUBLIC_API_BASEURL}/vendor/venues?Page=${page}&Filter=${filter}`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${authToken}` }
			}
		)
			.then((resp) => resp.json())
			.then((data) => data)
			.catch((error) => error);
	}

	async function fetchEvents({
		queryKey
	}: {
		queryKey: [string, queryParams];
	}) {
		const [_key, { page }] = queryKey;
		const authToken = getAuthToken();
		console.log(_key, page);
		return await fetch(
			`${process.env.NX_PUBLIC_API_BASEURL}/vendor/events?Page=${page}&EventDatetime=${new Date().toISOString()}&Filter=${filter}`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${authToken}` }
			}
		)
			.then((resp) => resp.json())
			.then((data) => data)
			.catch((error) => error);
	}

	async function fetchHistoricalEvents({
		queryKey
	}: {
		queryKey: [string, queryParams];
	}) {
		const [_key, { page }] = queryKey;
		const authToken = getAuthToken();
		console.log(_key, page);
		return await fetch(
			`${process.env.NX_PUBLIC_API_BASEURL}/vendor/events?Page=${page}&Filter=${filter}`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${authToken}` }
			}
		)
			.then((resp) => resp.json())
			.then((data) => data)
			.catch((error) => error);
	}

	function updatePage(add: boolean) {
		switch (activeTab) {
			case 'events':
				if (add) setEventsPage(eventsPage + 1);
				else
					setEventsPage(
						eventsPage !== 1 ? eventsPage - 1 : eventsPage
					);
				break;
			case 'historical_events':
				if (add) setEventsHistoryPage(eventsHistoryPage + 1);
				else
					setEventsHistoryPage(
						eventsHistoryPage !== 1
							? eventsHistoryPage - 1
							: eventsHistoryPage
					);
				break;
			case 'venues':
				if (add) setVenuesPage(venuesPage + 1);
				else
					setVenuesPage(
						venuesPage !== 1 ? venuesPage - 1 : venuesPage
					);
				break;
			default:
				console.error('That is not an available tab.');
		}
	}

	const addRow = () => {
		setModalType(activeTab as 'events' | 'venues');
		setShowModal(true);
	};

	const filterData = (e: React.ChangeEvent<HTMLInputElement>) => {
		tempFilter.current = e.target.value.toLowerCase();
	};

	const updateTab = (e: string) => {
		setActiveTab(e as 'events' | 'venues' | 'historical_events');
	};

	useEffect(() => {
		if (showModal && wasAddSuccessful) {
			setWasAddSuccessful(false);
		}
	}, [showModal, wasAddSuccessful]);

	useEffect(() => {
		if (wasAddSuccessful) {
			queryClient.invalidateQueries({ queryKey: ['events'] });
			queryClient.invalidateQueries({ queryKey: ['venues'] });
			queryClient.invalidateQueries({ queryKey: ['historical_events'] });
		}
	}, [wasAddSuccessful]);

	// Doing this to handle ReactQuery requerying on state change but wanting to save filter value across page loads without requerying every time a key is pressed.
	useEffect(() => {
		tempFilter.current = filter;
	}, [eventsPage, venuesPage, eventsHistoryPage, filter]);

	return (
		<Container size={'4'}>
			{wasAddSuccessful && (
				<Box pt="4">
					<SuccessAlert message="Created Successfully" />
				</Box>
			)}
			<Box style={{ padding: '16px 16px' }}>
				<Tabs.Root defaultValue={activeTab} onValueChange={updateTab}>
					<Flex justify="between">
						<Tabs.List size="2">
							<Tabs.Trigger value="events">Events</Tabs.Trigger>
							<Tabs.Trigger value="venues">Venues</Tabs.Trigger>
							<Tabs.Trigger value="historical_events">
								Event History
							</Tabs.Trigger>
						</Tabs.List>
						<Flex>
							<TextField.Root
								placeholder="search"
								size="3"
								onChangeCapture={filterData}
								onKeyDownCapture={(e) =>
									e.key === 'Enter'
										? setFilter(tempFilter.current)
										: null
								}
								style={{ marginRight: '8px' }}
							></TextField.Root>
							<Button
								onClick={() => setFilter(tempFilter.current)}
								size="3"
								style={{ marginRight: '4px' }}
							>
								{' '}
								🔎{' '}
							</Button>
							{activeTab !== 'historical_events' && (
								<Button
									onClick={addRow}
									size="3"
									style={{ marginRight: '3px' }}
								>
									+{' '}
								</Button>
							)}
						</Flex>
					</Flex>
					<Box>
						<Tabs.Content value="events">
							<QueryClientProvider client={queryClient}>
								<Events page={eventsPage} />
							</QueryClientProvider>
						</Tabs.Content>
						<Tabs.Content value="venues">
							<QueryClientProvider client={queryClient}>
								<Venues page={venuesPage} />
							</QueryClientProvider>
						</Tabs.Content>
						<Tabs.Content value="historical_events">
							<QueryClientProvider client={queryClient}>
								<HistoricalEvents page={eventsHistoryPage} />
							</QueryClientProvider>
						</Tabs.Content>
						<Flex justify="between" width="100px">
							<Button onClick={() => updatePage(false)}>
								{'<'}
							</Button>
							<Button onClick={() => updatePage(true)}>
								{'>'}
							</Button>
						</Flex>
					</Box>
				</Tabs.Root>
				{showModal &&
					modalType &&
					(modalType === 'events' ? (
						<AddEventModal
							onClose={() => setShowModal(false)}
							onSuccess={() => setWasAddSuccessful(true)}
						/>
					) : (
						<AddVenueModal
							onClose={() => setShowModal(false)}
							onSuccess={() => setWasAddSuccessful(true)}
						/>
					))}
			</Box>
		</Container>
	);
}
